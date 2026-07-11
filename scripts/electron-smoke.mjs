import { spawn } from "node:child_process";
import electronPath from "electron";

const child = spawn(electronPath, ["."], {
  cwd: process.cwd(),
  env: {
    ...process.env,
    ORDEROPS_ELECTRON_SMOKE: "1",
  },
  stdio: "inherit",
});

child.on("exit", (code) => {
  process.exit(code ?? 0);
});
