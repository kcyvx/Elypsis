# Elypsis

Add ready-to-use **login** and **register** pages, with the auth logic behind them, to a Next.js project. One command.

```bash
npx elypsis-cli init
# or simply
npx elypsis-cli
```

## What it does

1. Detects your project (App Router, `src/` or not, package manager, Next.js version).
2. Lets you choose your database:
   - **SQLite** (`better-sqlite3`): Zero-config local development (`sqlite.db`).
   - **PostgreSQL** (`pg`): Production ready for **Vercel**, **Neon**, **Supabase**.
3. Copies these files into your project (they are yours, edit them freely):
   - `lib/auth.ts` and `lib/auth-client.ts`
   - `app/api/auth/[...all]/route.ts`
   - `app/login/page.tsx`, `app/register/page.tsx`
   - `app/dashboard/page.tsx` (protected example)
   - `middleware.ts` (`proxy.ts` on Next.js 16+)
4. Configures environment variables in `.env.local` (`BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`, and `DATABASE_URL` if Postgres).
5. Installs dependencies (`better-auth` + database driver).
6. Sets up the database tables.

Existing files are never overwritten unless you pass `--force`.

## Requirements

- Next.js with the App Router
- TypeScript
- Tailwind CSS (the templates use utility classes)

## Options

| Flag | Effect |
| --- | --- |
| `-d, --db <type>` | choose database (`sqlite` or `postgres`) |
| `-y, --yes` | skip the confirmation prompt |
| `-f, --force` | overwrite existing files |
| `--cwd <path>` | run against another folder |

## Usage After Install

### Client Component

```tsx
"use client";

import { authClient } from "@/lib/auth-client";

export default function Profile() {
  const { data: session, isPending } = authClient.useSession();

  if (isPending) return <p>Loading...</p>;
  if (!session) return <p>Not signed in</p>;

  return <p>Signed in as {session.user.email}</p>;
}
```

### Server Component

```tsx
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export default async function DashboardPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    // redirect or show unauthorized
  }

  return <h1>Welcome {session.user.name}</h1>;
}
```

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
