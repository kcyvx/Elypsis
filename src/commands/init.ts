import path from "node:path";
import * as p from "@clack/prompts";
import pc from "picocolors";
import { detectProject, type ProjectInfo } from "../utils/detect";
import { copyTemplates, ignoreDatabase, writeEnv } from "../utils/files";
import { installDeps, migrateDatabase } from "../utils/install";

interface InitOptions {
  yes: boolean;
  force: boolean;
  cwd: string;
}

function fail(message: string): never {
  p.cancel(message);
  process.exit(1);
}

export async function init(options: InitOptions) {
  p.intro(pc.bgMagenta(pc.black(" elypsis ")));

  let project: ProjectInfo;
  try {
    project = detectProject(path.resolve(options.cwd));
  } catch (error) {
    return fail((error as Error).message);
  }

  if (!project.hasAppRouter) fail("Elypsis needs the App Router (an `app/` or `src/app/` folder).");
  if (!project.isTypeScript) fail("Elypsis needs a TypeScript project (no tsconfig.json found).");

  p.log.info(
    `Next.js ${project.nextMajor ?? "?"} · ${project.packageManager} · ${project.hasSrcDir ? "src/ layout" : "root layout"}`,
  );

  if (!options.yes) {
    const ok = await p.confirm({
      message: "Add email + password auth (Better Auth, SQLite) to this project?",
    });
    if (p.isCancel(ok) || !ok) {
      p.cancel("Nothing was changed.");
      process.exit(0);
    }
  }

  // 1. Files
  const { created, skipped } = copyTemplates(project, options.force);
  created.forEach((file) => p.log.success(`created ${file}`));
  skipped.forEach((file) => p.log.warn(`skipped ${file} (already exists, use --force to overwrite)`));

  // 2. Environment
  const envKeys = writeEnv(project.root);
  if (envKeys.length > 0) p.log.success(`added ${envKeys.join(", ")} to .env.local`);
  if (ignoreDatabase(project.root)) p.log.success("added sqlite.db to .gitignore");

  // 3. Dependencies
  const spinner = p.spinner();
  spinner.start("Installing better-auth and better-sqlite3");
  try {
    await installDeps(project.packageManager, project.root, ["better-auth", "better-sqlite3"], [
      "@types/better-sqlite3",
    ]);
    spinner.stop("Dependencies installed");
  } catch (error) {
    spinner.stop(pc.red("Dependency installation failed"));
    p.log.error(String((error as Error).message));
    fail("Fix the error above, then run the install manually: better-auth better-sqlite3 @types/better-sqlite3");
  }

  // 4. Database
  const authConfig = path.join(project.hasSrcDir ? "src" : ".", "lib", "auth.ts");
  spinner.start("Creating database tables");
  try {
    await migrateDatabase(project.root, authConfig);
    spinner.stop("Database ready (sqlite.db)");
  } catch {
    spinner.stop(pc.yellow("Could not create the tables automatically"));
    p.log.warn(`Run this yourself: npx @better-auth/cli@latest migrate --config ${authConfig}`);
  }

  p.note(
    [
      `${pc.cyan("/register")}   create an account`,
      `${pc.cyan("/login")}      sign in`,
      `${pc.cyan("/dashboard")}  protected page`,
    ].join("\n"),
    "Routes",
  );
  p.outro(`Done. Start the app with ${pc.cyan(`${project.packageManager} run dev`)}`);
}
