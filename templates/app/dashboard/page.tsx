import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import SignOutButton from "./sign-out-button";

export default async function DashboardPage() {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) {
    redirect("/login");
  }

  return (
    <main className="mx-auto max-w-2xl space-y-6 p-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold">Hello, {session.user.name}</h1>
        <p className="text-sm text-neutral-500">You are signed in as {session.user.email}.</p>
      </div>
      <SignOutButton />
    </main>
  );
}
