"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { authClient } from "@/lib/auth-client";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (loading) return;

    setError(null);
    setLoading(true);

    const form = new FormData(event.currentTarget);
    const inputEmail = String(form.get("email") ?? "").trim().toLowerCase();
    setEmail(inputEmail);

    const { error } = await authClient.forgetPassword({
      email: inputEmail,
      redirectTo: "/reset-password",
    });

    setLoading(false);

    if (error) {
      setError(error.message ?? "Could not send reset link. Try again later.");
      return;
    }

    setSubmitted(true);
  }

  return (
    <main className="flex min-h-screen items-center justify-center p-6">
      <div className="w-full max-w-sm space-y-6">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold">Reset password</h1>
          <p className="text-sm text-neutral-500">
            {submitted
              ? "Check your inbox for a reset link."
              : "Enter your email and we'll send you a link to reset your password."}
          </p>
        </div>

        {submitted ? (
          <div className="space-y-4">
            <div className="rounded-md border border-neutral-200 bg-neutral-50 p-4 text-sm text-neutral-700 dark:border-neutral-800 dark:bg-neutral-900/50 dark:text-neutral-300">
              <p>
                We sent a password reset link to <strong className="font-semibold text-neutral-900 dark:text-white">{email}</strong>.
              </p>
              <p className="mt-2 text-xs text-neutral-500">
                In local dev without Resend API key, the link is logged directly to your terminal.
              </p>
            </div>

            <Link
              href="/login"
              className="block w-full text-center rounded-md bg-neutral-900 px-3 py-2 text-sm font-medium text-white dark:bg-neutral-100 dark:text-neutral-900"
            >
              Back to sign in
            </Link>
          </div>
        ) : (
          <form onSubmit={onSubmit} className="space-y-4">
            <fieldset disabled={loading} className="space-y-4">
              <div className="space-y-1.5">
                <label htmlFor="email" className="text-sm font-medium">
                  Email
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  autoComplete="email"
                  className="w-full rounded-md border border-neutral-300 bg-transparent px-3 py-2 text-sm outline-none focus:border-neutral-900 disabled:opacity-60 dark:border-neutral-700 dark:focus:border-neutral-300"
                />
              </div>

              {error && (
                <p role="alert" className="text-sm text-red-600">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-md bg-neutral-900 px-3 py-2 text-sm font-medium text-white disabled:opacity-60 dark:bg-neutral-100 dark:text-neutral-900"
              >
                {loading ? "Sending link…" : "Send reset link"}
              </button>
            </fieldset>

            <p className="text-sm text-neutral-500">
              Remember your password?{" "}
              <Link href="/login" className="font-medium text-neutral-900 underline dark:text-neutral-100">
                Sign in
              </Link>
            </p>
          </form>
        )}
      </div>
    </main>
  );
}
