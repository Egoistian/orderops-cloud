import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const forwardedViteArgs = process.argv.slice(2);

const api = spawn(process.execPath, ["--env-file-if-exists=.env", "--watch", "server/index.mjs"], {
  cwd: root,
  stdio: "inherit",
  env: process.env,
});

const web = spawn(
  process.execPath,
  ["node_modules/vite/bin/vite.js", "--host", "127.0.0.1", ...forwardedViteArgs],
  {
    cwd: root,
    stdio: "inherit",
    env: process.env,
  },
);

let shuttingDown = false;
function stop(exitCode = 0) {
  if (shuttingDown) return;
  shuttingDown = true;
  api.kill("SIGTERM");
  web.kill("SIGTERM");
  setTimeout(() => process.exit(exitCode), 100).unref();
}

api.on("exit", (code) => {
  if (!shuttingDown && code) stop(code);
});
web.on("exit", (code) => {
  if (!shuttingDown && code) stop(code);
});
process.on("SIGINT", () => stop(0));
process.on("SIGTERM", () => stop(0));
