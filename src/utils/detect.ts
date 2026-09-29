import fs from "node:fs";
import path from "node:path";

export type PackageManager = "npm" | "pnpm" | "yarn" | "bun";

export interface ProjectInfo {
  root: string;
  /** Folder that contains `app/` (either `<root>/src` or `<root>`). */
  srcRoot: string;
  hasSrcDir: boolean;
  hasAppRouter: boolean;
  isTypeScript: boolean;
  packageManager: PackageManager;
  nextMajor: number | null;
}

function readJson(file: string) {
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function detectNextMajor(root: string, pkg: any): number | null {
  // Prefer the installed version, fall back to the declared range.
  const installed = path.join(root, "node_modules", "next", "package.json");
  const raw = fs.existsSync(installed)
    ? readJson(installed).version
    : (pkg.dependencies?.next ?? pkg.devDependencies?.next);
  const major = parseInt(String(raw).replace(/^\D*/, ""), 10);
  return Number.isNaN(major) ? null : major;
}

function detectPackageManager(root: string): PackageManager {
  if (fs.existsSync(path.join(root, "pnpm-lock.yaml"))) return "pnpm";
  if (fs.existsSync(path.join(root, "yarn.lock"))) return "yarn";
  if (fs.existsSync(path.join(root, "bun.lock")) || fs.existsSync(path.join(root, "bun.lockb"))) return "bun";
  return "npm";
}

export function detectProject(root: string): ProjectInfo {
  const pkgPath = path.join(root, "package.json");
  if (!fs.existsSync(pkgPath)) {
    throw new Error("No package.json found. Run this command at the root of a Next.js project.");
  }

  const pkg = readJson(pkgPath);
  if (!pkg.dependencies?.next && !pkg.devDependencies?.next) {
    throw new Error("Next.js was not found in this project's dependencies.");
  }

  const hasSrcApp = fs.existsSync(path.join(root, "src", "app"));
  const hasRootApp = fs.existsSync(path.join(root, "app"));

  return {
    root,
    srcRoot: hasSrcApp ? path.join(root, "src") : root,
    hasSrcDir: hasSrcApp,
    hasAppRouter: hasSrcApp || hasRootApp,
    isTypeScript: fs.existsSync(path.join(root, "tsconfig.json")),
    packageManager: detectPackageManager(root),
    nextMajor: detectNextMajor(root, pkg),
  };
}
