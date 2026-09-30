import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";
import type { ProjectInfo } from "./detect";

/** Templates ship next to `dist/` in the published package. */
export const TEMPLATES_DIR = fileURLToPath(new URL("../templates", import.meta.url));

export interface CopyResult {
  created: string[];
  skipped: string[];
}

function walk(dir: string): string[] {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    return entry.isDirectory() ? walk(full) : [full];
  });
}

export type DatabaseType = "sqlite" | "postgres";

/**
 * Copy every file from templates/ into the project.
 * - existing files are skipped unless `force` is set
 * - Next.js 16+ renamed `middleware.ts` to `proxy.ts`, so we adapt it
 * - Adapts lib/auth.ts depending on the chosen database (sqlite vs postgres)
 */
export function copyTemplates(
  project: ProjectInfo,
  force: boolean,
  database: DatabaseType = "sqlite",
): CopyResult {
  const result: CopyResult = { created: [], skipped: [] };

  for (const file of walk(TEMPLATES_DIR)) {
    let rel = path.relative(TEMPLATES_DIR, file);
    let content = fs.readFileSync(file, "utf8");

    if (rel === "middleware.ts" && project.nextMajor !== null && project.nextMajor >= 16) {
      rel = "proxy.ts";
      content = content.replace("export function middleware", "export function proxy");
    }

    if (rel === path.join("lib", "auth.ts") && database === "postgres") {
      content = `import { betterAuth } from "better-auth";
import { nextCookies } from "better-auth/next-js";
import { Pool } from "pg";
import { Resend } from "resend";

const pool =
  (globalThis as unknown as { pgPool?: Pool }).pgPool ||
  new Pool({
    connectionString: process.env.DATABASE_URL,
  });

if (process.env.NODE_ENV !== "production") {
  (globalThis as unknown as { pgPool?: Pool }).pgPool = pool;
}

const resend = new Resend(process.env.RESEND_API_KEY);

export const auth = betterAuth({
  database: pool,
  emailAndPassword: {
    enabled: true,
    async sendResetPassword({ user, url }) {
      if (!process.env.RESEND_API_KEY) {
        console.log(\`\\n🔑 [Elypsis Dev] Reset password link for \${user.email}:\\n\${url}\\n\`);
        return;
      }

      await resend.emails.send({
        from: process.env.EMAIL_FROM || "Auth <onboarding@resend.dev>",
        to: user.email,
        subject: "Reset your password",
        html: \`<p>Hello \${user.name || "there"},</p><p>Click the link below to reset your password:</p><p><a href="\${url}">Reset Password</a></p>\`,
      });
    },
  },
  // keep nextCookies() last in the list
  plugins: [nextCookies()],
});
`;
    }

    const dest = path.join(project.srcRoot, rel);
    const shown = path.relative(project.root, dest);

    if (fs.existsSync(dest) && !force) {
      result.skipped.push(shown);
      continue;
    }

    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.writeFileSync(dest, content);
    result.created.push(shown);
  }

  return result;
}

/** Add missing keys to `.env.local` without touching existing ones. */
export function writeEnv(root: string, database: DatabaseType = "sqlite"): string[] {
  const envPath = path.join(root, ".env.local");
  const current = fs.existsSync(envPath) ? fs.readFileSync(envPath, "utf8") : "";
  const added: string[] = [];
  let next = current;

  const ensure = (key: string, value: string) => {
    if (new RegExp(`^${key}=`, "m").test(current)) return;
    if (next.length > 0 && !next.endsWith("\n")) next += "\n";
    next += `${key}=${value}\n`;
    added.push(key);
  };

  ensure("BETTER_AUTH_SECRET", crypto.randomBytes(32).toString("base64url"));
  ensure("BETTER_AUTH_URL", "http://localhost:3000");

  if (database === "postgres") {
    ensure("DATABASE_URL", "postgresql://postgres:postgres@localhost:5432/mydb");
  }

  ensure("RESEND_API_KEY", "");

  if (added.length > 0) fs.writeFileSync(envPath, next);
  return added;
}

/** Make sure the SQLite file never ends up in git. */
export function ignoreDatabase(root: string): boolean {
  const gitignore = path.join(root, ".gitignore");
  const current = fs.existsSync(gitignore) ? fs.readFileSync(gitignore, "utf8") : "";
  if (/^sqlite\.db$/m.test(current)) return false;
  const sep = current.length > 0 && !current.endsWith("\n") ? "\n" : "";
  fs.writeFileSync(gitignore, `${current}${sep}\n# elypsis\nsqlite.db\n`);
  return true;
}
