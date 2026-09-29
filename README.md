# Elypsis

Add ready-to-use **login** and **register** pages, with the auth logic behind them, to a Next.js project. One command.

```bash
npx elypsis-cli init
# or simply
npx elypsis-cli
```

## What it does

1. Detects your project (App Router, `src/` or not, package manager, Next.js version).
2. Copies these files into your project (they are yours, edit them freely):
   - `lib/auth.ts` and `lib/auth-client.ts`
   - `app/api/auth/[...all]/route.ts`
   - `app/login/page.tsx`, `app/register/page.tsx`
   - `app/dashboard/page.tsx` (protected example)
   - `middleware.ts` (`proxy.ts` on Next.js 16+)
3. Adds `BETTER_AUTH_SECRET` and `BETTER_AUTH_URL` to `.env.local`.
4. Installs `better-auth` and `better-sqlite3`.
5. Creates the database tables.

Existing files are never overwritten unless you pass `--force`.

## Requirements

- Next.js with the App Router
- TypeScript
- Tailwind CSS (the templates use utility classes)

## Options

| Flag | Effect |
| --- | --- |
| `-y, --yes` | skip the confirmation prompt |
| `-f, --force` | overwrite existing files |
| `--cwd <path>` | run against another folder |

## Develop

```bash
npm install
npm run build
node dist/index.js init --cwd ../my-next-app
```

## Roadmap

- `elypsis add oauth` (Google, GitHub)
- `elypsis add reset` (forgotten password)
- `elypsis add verify-email`
- Prisma / Drizzle + Postgres instead of SQLite
