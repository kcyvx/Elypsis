"use client";

import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";

export default function SignOutButton() {
  const router = useRouter();

  return (
    <button
      type="button"
      onClick={() =>
        authClient.signOut({
          fetchOptions: { onSuccess: () => router.push("/login") },
        })
      }
      className="rounded-md border border-neutral-300 px-3 py-2 text-sm font-medium dark:border-neutral-700"
    >
      Sign out
    </button>
  );
}
