import { execa } from "execa";
import type { PackageManager } from "./detect";

const ADD: Record<PackageManager, { prod: string[]; dev: string[] }> = {
  npm: { prod: ["install"], dev: ["install", "-D"] },
  pnpm: { prod: ["add"], dev: ["add", "-D"] },
  yarn: { prod: ["add"], dev: ["add", "-D"] },
  bun: { prod: ["add"], dev: ["add", "-d"] },
};

export async function installDeps(
  pm: PackageManager,
  cwd: string,
  deps: string[],
  devDeps: string[],
) {
  if (deps.length > 0) await execa(pm, [...ADD[pm].prod, ...deps], { cwd });
  if (devDeps.length > 0) await execa(pm, [...ADD[pm].dev, ...devDeps], { cwd });
}

/** Create the auth tables in the SQLite database. */
export async function migrateDatabase(cwd: string, configPath: string) {
  await execa("npx", ["--yes", "@better-auth/cli@latest", "migrate", "--yes", "--config", configPath], { cwd });
}
