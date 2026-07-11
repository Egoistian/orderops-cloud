import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createApp } from "./app.mjs";
import { createPool, createPostgresStore } from "./database.mjs";

const port = Number(process.env.PORT || 8787);
const host = process.env.HOST || "127.0.0.1";
const pool = createPool();
const store = createPostgresStore(pool);
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dist = path.join(root, "dist");
const app = createApp({ store, staticDir: existsSync(dist) ? dist : undefined });

try {
  await store.deleteExpiredSessions();
} catch (error) {
  console.warn("OrderOps session cleanup deferred until the database is ready.", error.message);
}

const cleanupTimer = setInterval(() => {
  store.deleteExpiredSessions().catch((error) => {
    console.warn("OrderOps session cleanup failed.", error.message);
  });
}, 15 * 60 * 1000);
cleanupTimer.unref();

const server = app.listen(port, host, () => {
  console.log(`OrderOps API ready at http://${host}:${port}`);
});

let shuttingDown = false;
async function shutdown() {
  if (shuttingDown) return;
  shuttingDown = true;
  clearInterval(cleanupTimer);
  server.close(async (error) => {
    try {
      await pool.end();
    } finally {
      process.exit(error ? 1 : 0);
    }
  });
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
