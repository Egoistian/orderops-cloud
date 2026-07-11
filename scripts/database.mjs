import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";
import { createPool, DEFAULT_DATABASE_URL } from "../server/database.mjs";
import { seedDatabase } from "../server/seed.mjs";

const { Pool } = pg;
const command = process.argv[2] || "setup";
const databaseUrl = process.env.DATABASE_URL || DEFAULT_DATABASE_URL;
const targetUrl = new URL(databaseUrl);
const databaseName = decodeURIComponent(targetUrl.pathname.slice(1));

if (!/^[a-zA-Z0-9_]+$/.test(databaseName)) {
  throw new Error("DATABASE_URL의 데이터베이스 이름은 영문, 숫자, 밑줄만 사용할 수 있습니다.");
}

async function ensureDatabase() {
  const adminUrl = new URL(targetUrl);
  adminUrl.pathname = "/postgres";
  const adminPool = new Pool({ connectionString: adminUrl.toString(), max: 1 });
  try {
    const exists = await adminPool.query("select 1 from pg_database where datname = $1", [databaseName]);
    if (!exists.rowCount) await adminPool.query(`create database "${databaseName}"`);
  } finally {
    await adminPool.end();
  }
}

async function migrate(pool) {
  const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
  const schema = await readFile(path.join(root, "server", "schema.sql"), "utf8");
  await pool.query(schema);
}

if (!["setup", "migrate", "seed", "reset"].includes(command)) {
  throw new Error("사용법: node scripts/database.mjs setup|migrate|seed|reset");
}

if (command === "setup") await ensureDatabase();
const pool = createPool(databaseUrl);
try {
  if (command === "setup" || command === "migrate") await migrate(pool);
  if (command === "setup" || command === "seed" || command === "reset") await seedDatabase(pool);
  console.log(`Database ${command} complete: ${databaseName}`);
} finally {
  await pool.end();
}
