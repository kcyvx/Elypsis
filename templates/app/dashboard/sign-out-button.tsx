"use client";

import { useState } from "react";
import { authClient } from "@/lib/auth-client";

export default function SignOutButton() {
  const [loading, setLoading] = useState(false);

  async function handleSignOut() {
    setLoading(true);
    try {
      await authClient.signOut();
    } catch (e) {
      console.error("Sign out error:", e);
    } finally {
      window.location.href = "/login";
    }
  }

  return (
    <button
      type="button"
      onClick={handleSignOut}
      disabled={loading}
      className="cursor-pointer rounded-md border border-neutral-300 px-3 py-2 text-sm font-medium disabled:opacity-60 dark:border-neutral-700"
    >
      {loading ? "Signing out…" : "Sign out"}
    </button>
  );
}
