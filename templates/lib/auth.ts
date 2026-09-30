import { betterAuth } from "better-auth";
import { nextCookies } from "better-auth/next-js";
import Database from "better-sqlite3";
import { Resend } from "resend";

export const auth = betterAuth({
  database: new Database("./sqlite.db"),
  emailAndPassword: {
    enabled: true,
    async sendResetPassword({ user, url }) {
      if (!process.env.RESEND_API_KEY) {
        console.log(`\n🔑 [Elypsis Dev] Reset password link for ${user.email}:\n${url}\n`);
        return;
      }

      const resend = new Resend(process.env.RESEND_API_KEY);
      await resend.emails.send({
        from: process.env.EMAIL_FROM || "Auth <onboarding@resend.dev>",
        to: user.email,
        subject: "Reset your password",
        html: `<p>Hello ${user.name || "there"},</p><p>Click the link below to reset your password:</p><p><a href="${url}">Reset Password</a></p>`,
      });
    },
  },
  // keep nextCookies() last in the list
  plugins: [nextCookies()],
});
