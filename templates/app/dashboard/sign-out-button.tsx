"use client";

import { authClient } from "@/lib/auth-client";

export default function SignOutButton() {
  return (
    <button
      type="button"
      onClick={() =>
        authClient.signOut({
          fetchOptions: {
            onSuccess: () => {
              window.location.href = "/login";
            },
          },
        })
      }
      className="rounded-md border border-neutral-300 px-3 py-2 text-sm font-medium dark:border-neutral-700"
    >
      Sign out
    </button>
  );
}

