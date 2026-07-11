import packager from "@electron/packager";
import path from "node:path";

const root = process.cwd();

const appPaths = await packager({
  dir: root,
  name: "OrderOps Cloud",
  executableName: "OrderOps Cloud",
  platform: "win32",
  arch: "x64",
  out: path.join(root, "release"),
  overwrite: true,
  asar: true,
  prune: true,
  appVersion: "1.0.0",
  win32metadata: {
    CompanyName: "OrderOps Cloud Portfolio",
    FileDescription: "Order cleanup and logistics classification desktop app",
    ProductName: "OrderOps Cloud",
  },
  ignore: [
    /^\/\.DS_Store$/,
    /^\/node_modules\/\.vite(\/|$)/,
    /^\/portfolio_assets(\/|$)/,
    /^\/release(\/|$)/,
    /^\/src(\/|$)/,
  ],
});

console.log("Windows package created:");
for (const appPath of appPaths) {
  console.log(appPath);
}
