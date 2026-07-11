import test, { after, afterEach, before, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { once } from "node:events";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { createServer } from "node:net";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";
import { createPool, DEFAULT_DATABASE_URL } from "../server/database.mjs";
import { seedDatabase } from "../server/seed.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const accessPassword = process.env.ACCESS_ACCOUNT_PASSWORD || "orderops-access-2026";
const activeContexts = new Set();

let browser;
let adminPool;
let pool;
let serverProcess;
let baseUrl;
let isolatedDatabaseUrl;
let testSchema;
let temporaryDirectory;
let serverOutput = "";

function run(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd: root,
      env: process.env,
      stdio: ["ignore", "pipe", "pipe"],
      ...options,
    });
    let output = "";
    child.stdout.on("data", (chunk) => {
      output += chunk;
    });
    child.stderr.on("data", (chunk) => {
      output += chunk;
    });
    child.once("error", reject);
    child.once("exit", (code, signal) => {
      if (code === 0) resolve(output);
      else reject(new Error(`${command} exited with ${code ?? signal}.\n${output}`));
    });
  });
}

async function reservePort() {
  const listener = createServer();
  listener.listen(0, "127.0.0.1");
  await once(listener, "listening");
  const address = listener.address();
  const port = address.port;
  await new Promise((resolve, reject) => listener.close((error) => (error ? reject(error) : resolve())));
  return port;
}

async function waitForReady(url) {
  const deadline = Date.now() + 15_000;
  while (Date.now() < deadline) {
    if (serverProcess.exitCode !== null) {
      throw new Error(`Production server exited before readiness.\n${serverOutput}`);
    }
    try {
      const response = await fetch(`${url}/api/health/ready`);
      if (response.ok) return;
    } catch {
      // The process can be listening a moment after spawn; retry until the deadline.
    }
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  throw new Error(`Production server did not become ready.\n${serverOutput}`);
}

async function stopServer() {
  if (!serverProcess || serverProcess.exitCode !== null) return;
  const exited = new Promise((resolve) => serverProcess.once("exit", resolve));
  serverProcess.kill("SIGTERM");
  const stopped = await Promise.race([
    exited.then(() => true),
    new Promise((resolve) => setTimeout(() => resolve(false), 5_000)),
  ]);
  if (!stopped) {
    serverProcess.kill("SIGKILL");
    await exited;
  }
}

async function createPage(viewport) {
  const context = await browser.newContext({ viewport });
  activeContexts.add(context);
  const page = await context.newPage();
  const browserIssues = [];
  const networkIssues = [];
  page.on("console", (message) => {
    if (
      message.type() === "error" &&
      message.text() === "Failed to load resource: the server responded with a status of 401 (Unauthorized)"
    ) {
      return;
    }
    if (["error", "warning"].includes(message.type())) {
      browserIssues.push(`console.${message.type()}: ${message.text()}`);
    }
  });
  page.on("pageerror", (error) => browserIssues.push(`pageerror: ${error.message}`));
  page.on("response", (response) => {
    if (response.status() < 400) return;
    const url = new URL(response.url());
    if (response.status() === 401 && url.pathname === "/api/auth/me") return;
    networkIssues.push(`${response.status()} ${url.pathname}`);
  });
  return { context, page, browserIssues, networkIssues };
}

async function loginAs(page, roleName) {
  await page.getByRole("heading", { name: "OrderOps Cloud" }).waitFor();
  await page.getByLabel("테넌트 선택").selectOption("seoul-fresh");
  await page.getByRole("button", { name: new RegExp(roleName) }).click();
  await page.getByLabel("비밀번호", { exact: true }).fill(accessPassword);
  await page.getByRole("button", { name: "주문 워크스페이스 열기" }).click();
  await page.getByRole("heading", { name: "주문 관리" }).waitFor();
  await page.getByRole("row", { name: /SF-20260711-001/ }).waitFor();
}

async function assertNoDocumentOverflow(page, label) {
  const dimensions = await page.evaluate(() => ({
    viewportWidth: window.innerWidth,
    viewportHeight: window.innerHeight,
    rootClientWidth: document.documentElement.clientWidth,
    rootScrollWidth: document.documentElement.scrollWidth,
    bodyScrollWidth: document.body.scrollWidth,
  }));
  assert.equal(dimensions.viewportWidth, 390, `${label}: viewport width`);
  assert.equal(dimensions.viewportHeight, 844, `${label}: viewport height`);
  assert.ok(
    dimensions.rootScrollWidth <= dimensions.rootClientWidth + 1,
    `${label}: document overflowed horizontally (${JSON.stringify(dimensions)})`,
  );
  assert.ok(
    dimensions.bodyScrollWidth <= dimensions.rootClientWidth + 1,
    `${label}: body overflowed horizontally (${JSON.stringify(dimensions)})`,
  );
}

before(async () => {
  temporaryDirectory = await mkdtemp(path.join(tmpdir(), "orderops-e2e-"));
  const npm = process.platform === "win32" ? "npm.cmd" : "npm";
  await run(npm, ["run", "build"]);

  const baseDatabaseUrl = process.env.DATABASE_URL || DEFAULT_DATABASE_URL;
  testSchema = `orderops_e2e_${process.pid}_${Date.now()}`;
  adminPool = createPool(baseDatabaseUrl);
  await adminPool.query(`create schema "${testSchema}"`);

  const isolatedUrl = new URL(baseDatabaseUrl);
  isolatedUrl.searchParams.set("options", `-c search_path=${testSchema}`);
  isolatedDatabaseUrl = isolatedUrl.toString();
  pool = createPool(isolatedDatabaseUrl);
  const schema = await readFile(path.join(root, "server", "schema.sql"), "utf8");
  await pool.query(schema);
  await seedDatabase(pool, accessPassword);

  const port = await reservePort();
  baseUrl = `http://127.0.0.1:${port}`;
  serverProcess = spawn(process.execPath, ["server/index.mjs"], {
    cwd: root,
    env: {
      ...process.env,
      HOST: "127.0.0.1",
      PORT: String(port),
      NODE_ENV: "production",
      SESSION_COOKIE_SECURE: "false",
      SHARED_ACCESS_MODE: "false",
      ACCESS_ACCOUNT_PASSWORD: accessPassword,
      DATABASE_URL: isolatedDatabaseUrl,
    },
    stdio: ["ignore", "pipe", "pipe"],
  });
  serverProcess.stdout.on("data", (chunk) => {
    serverOutput += chunk;
  });
  serverProcess.stderr.on("data", (chunk) => {
    serverOutput += chunk;
  });
  await waitForReady(baseUrl);
  browser = await chromium.launch({ headless: true });
}, { timeout: 120_000 });

beforeEach(async () => {
  // Every browser case starts from the same deterministic orders and no sessions.
  await seedDatabase(pool, accessPassword);
});

afterEach(async () => {
  await Promise.all(Array.from(activeContexts, async (context) => {
    activeContexts.delete(context);
    await context.close();
  }));
  // Restore even after a failed assertion so no state leaks into the next case.
  await seedDatabase(pool, accessPassword);
});

after(async () => {
  await Promise.all(Array.from(activeContexts, async (context) => context.close()));
  activeContexts.clear();
  if (browser) await browser.close();
  await stopServer();
  if (pool) await pool.end();
  if (adminPool && testSchema) await adminPool.query(`drop schema if exists "${testSchema}" cascade`);
  if (adminPool) await adminPool.end();
  if (temporaryDirectory) await rm(temporaryDirectory, { recursive: true, force: true });
}, { timeout: 30_000 });

test("구축 사례 페이지는 제품 API 없이 모든 이미지와 모바일 레이아웃을 제공한다", {
  concurrency: false,
  timeout: 30_000,
}, async () => {
  const { page, browserIssues, networkIssues } = await createPage({ width: 390, height: 844 });
  const apiRequests = [];
  page.on("request", (request) => {
    const url = new URL(request.url());
    if (url.pathname.startsWith("/api/")) apiRequests.push(url.pathname);
  });

  const response = await page.goto(`${baseUrl}/case-study/`, { waitUntil: "networkidle" });
  assert.equal(response.status(), 200);
  assert.equal(new URL(page.url()).pathname, "/case-study");
  await page.getByRole("heading", { name: /주문이 움직일 때마다/ }).waitFor();

  const images = page.locator("main img");
  assert.ok(await images.count() >= 8, "구축 사례에 충분한 제품 이미지가 있어야 한다");
  const naturalWidths = await images.evaluateAll((elements) =>
    elements.map((element) => element instanceof HTMLImageElement ? element.naturalWidth : 0),
  );
  assert.ok(naturalWidths.every((width) => width > 0), `이미지 로드 실패: ${JSON.stringify(naturalWidths)}`);
  await assertNoDocumentOverflow(page, "mobile case study");

  assert.deepEqual(apiRequests, []);
  assert.deepEqual(browserIssues, []);
  assert.deepEqual(networkIssues, []);
});

test("운영 담당자 상태 변경은 감사 로그에 남고 열람 전용 역할은 변경할 수 없다", {
  concurrency: false,
  timeout: 30_000,
}, async () => {
  const { page, browserIssues, networkIssues } = await createPage({ width: 1440, height: 900 });
  await page.goto(baseUrl, { waitUntil: "domcontentloaded" });
  await loginAs(page, "운영 담당자");

  const orderRow = page.getByRole("row", { name: /SF-20260711-001/ });
  await orderRow.click();
  let inspector = page.getByRole("complementary", { name: /SF-20260711-001 주문 인스펙터/ });
  await inspector.getByRole("tab", { name: "상태 변경" }).click();
  await inspector.getByRole("button", { name: /^출고 완료(?!로 변경)/ }).click();

  const transitionNote = "E2E 출고 완료 검증";
  await inspector.getByLabel(/변경 사유/).fill(transitionNote);
  await inspector.getByRole("button", { name: "출고 완료로 변경" }).click();

  const transitionFeedback = inspector.getByRole("status");
  await transitionFeedback.waitFor();
  assert.match(await transitionFeedback.innerText(), /SF-20260711-001.*출고 완료 상태로 변경했습니다/);
  assert.match(await orderRow.innerText(), /출고 완료/);

  await inspector.getByRole("tab", { name: "감사 로그" }).click();
  await inspector.getByRole("heading", { name: "감사 타임라인" }).waitFor();
  await inspector.getByText(transitionNote, { exact: true }).waitFor();
  await inspector.getByText(/서울프레시 물류 운영 담당자 · 운영 담당자/).waitFor();
  await page.screenshot({ path: path.join(temporaryDirectory, "desktop-audit.png"), fullPage: false });

  await page.getByRole("button", { name: "로그아웃" }).click();
  await page.getByRole("heading", { name: "OrderOps Cloud" }).waitFor();
  await loginAs(page, "열람 전용");

  const readyOrder = page.getByRole("row", { name: /SF-20260710-016/ });
  await readyOrder.waitFor();
  await readyOrder.click();
  inspector = page.getByRole("complementary", { name: /SF-20260710-016 주문 인스펙터/ });
  await inspector.getByRole("tab", { name: "상태 변경" }).click();
  await inspector.getByText("열람 전용 계정은 주문을 변경할 수 없습니다.", { exact: true }).waitFor();
  assert.equal(await inspector.getByRole("button", { name: /로 변경$/ }).count(), 0);
  await page.screenshot({ path: path.join(temporaryDirectory, "desktop-viewer.png"), fullPage: false });

  assert.deepEqual(browserIssues, []);
  assert.deepEqual(networkIssues, []);
});

test("390x844 모바일에서 로그인과 대시보드가 문서 너비를 넘지 않는다", {
  concurrency: false,
  timeout: 30_000,
}, async () => {
  const { page, browserIssues, networkIssues } = await createPage({ width: 390, height: 844 });
  await page.goto(baseUrl, { waitUntil: "domcontentloaded" });
  await page.getByRole("heading", { name: "OrderOps Cloud" }).waitFor();
  await assertNoDocumentOverflow(page, "mobile login");
  await page.screenshot({ path: path.join(temporaryDirectory, "mobile-login.png"), fullPage: false });

  await loginAs(page, "운영 담당자");
  await page.getByRole("complementary", { name: /SF-20260711-001 주문 인스펙터/ }).waitFor();
  await assertNoDocumentOverflow(page, "mobile dashboard");
  await page.screenshot({ path: path.join(temporaryDirectory, "mobile-dashboard.png"), fullPage: false });

  assert.deepEqual(browserIssues, []);
  assert.deepEqual(networkIssues, []);
});
