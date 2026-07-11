import { createApp } from "../server/app.mjs";
import { createPool, createPostgresStore } from "../server/database.mjs";

const pool = createPool();
const store = createPostgresStore(pool);

// An Express application is a valid Vercel Node.js Function handler. Keeping
// the same app factory means local, Docker, integration-test, and hosted routes
// share one authorization and tenant-isolation implementation.
export default createApp({ store });
