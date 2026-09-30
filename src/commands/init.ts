import path from "node:path";
import * as p from "@clack/prompts";
import pc from "picocolors";
import { detectProject, type ProjectInfo } from "../utils/detect";
import { copyTemplates, ignoreDatabase, writeEnv, type DatabaseType } from "../utils/files";
import { installDeps, migrateDatabase } from "../utils/install";

interface InitOptions {
  yes: boolean;
  force: boolean;
  cwd: string;
  db?: DatabaseType;
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

  let database: DatabaseType = options.db ?? "sqlite";

  if (!options.yes && !options.db) {
    const selected = await p.select({
      message: "Which database would you like to use?",
      options: [
        {
          value: "sqlite",
          label: "SQLite",
          hint: "Zero-config local file (sqlite.db), perfect for dev",
        },
        {
          value: "postgres",
          label: "PostgreSQL",
          hint: "Neon, Supabase, Vercel Postgres (production ready)",
        },
      ],
      initialValue: "sqlite",
    });

    if (p.isCancel(selected)) {
      p.cancel("Nothing was changed.");
      process.exit(0);
    }
    database = selected as DatabaseType;
  }

  // 1. Files
  const { created, skipped } = copyTemplates(project, options.force, database);
  created.forEach((file) => p.log.success(`created ${file}`));
  skipped.forEach((file) => p.log.warn(`skipped ${file} (already exists, use --force to overwrite)`));

  // 2. Environment
  const envKeys = writeEnv(project.root, database);
  if (envKeys.length > 0) p.log.success(`added ${envKeys.join(", ")} to .env.local`);
  if (database === "sqlite" && ignoreDatabase(project.root)) {
    p.log.success("added sqlite.db to .gitignore");
  }

  // 3. Dependencies
  const prodDeps = database === "sqlite"
    ? ["better-auth", "better-sqlite3"]
    : ["better-auth", "pg"];
  const devDeps = database === "sqlite"
    ? ["@types/better-sqlite3"]
    : ["@types/pg"];

  const spinner = p.spinner();
  spinner.start(`Installing ${prodDeps.join(" and ")}`);
  try {
    await installDeps(project.packageManager, project.root, prodDeps, devDeps);
    spinner.stop("Dependencies installed");
  } catch (error) {
    spinner.stop(pc.red("Dependency installation failed"));
    p.log.error(String((error as Error).message));
    fail(`Fix the error above, then run: ${project.packageManager} install ${prodDeps.join(" ")}`);
  }

  // 4. Database setup & migrations
  const authConfig = path.join(project.hasSrcDir ? "src" : ".", "lib", "auth.ts");

  if (database === "sqlite") {
    spinner.start("Creating database tables");
    try {
      await migrateDatabase(project.root, authConfig);
      spinner.stop("Database ready (sqlite.db)");
    } catch {
      spinner.stop(pc.yellow("Could not create the tables automatically"));
      p.log.warn(`Run this yourself: npx @better-auth/cli@latest migrate --config ${authConfig}`);
    }
  } else {
    p.log.step("PostgreSQL configured (Neon / Supabase / Vercel)");
    p.log.info(
      `1. Make sure your ${pc.cyan("DATABASE_URL")} is set in ${pc.cyan(".env.local")}`,
    );
    p.log.info(
      `2. Create your tables by running: ${pc.cyan(`npx @better-auth/cli@latest migrate --config ${authConfig}`)}`,
    );
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
