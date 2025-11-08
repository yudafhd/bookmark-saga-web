import type { NextAuthOptions } from "next-auth";
import Google from "next-auth/providers/google";

export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt" },
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
      authorization: {
        params: {
          scope: "openid email profile https://www.googleapis.com/auth/drive.appdata",
          prompt: "consent",
          access_type: "offline",
          include_granted_scopes: "true",
        },
      },
    }),
  ],
  callbacks: {
    async jwt({ token, account }) {
      // On initial sign-in, persist tokens from Google
      if (account) {
        (token as any).access_token = (account as any).access_token;
        (token as any).refresh_token = (account as any).refresh_token ?? (token as any).refresh_token;
        (token as any).expires_at = (account as any).expires_at; // seconds epoch
        return token;
      }

      // Refresh expired access tokens if possible
      const expiresAt = (token as any).expires_at as number | undefined; // seconds
      if (expiresAt && Date.now() / 1000 > expiresAt - 60) {
        try {
          const refreshed = await refreshGoogleAccessToken(
            (token as any).refresh_token as string | undefined,
          );
          if (refreshed?.access_token) {
            (token as any).access_token = refreshed.access_token;
            (token as any).expires_at = Math.floor(Date.now() / 1000) + (refreshed.expires_in ?? 3600);
          }
        } catch (e) {
          // Failed to refresh; remove access token so middleware/pages can force re-login
          delete (token as any).access_token;
        }
      }
      return token;
    },
    async session({ session, token }) {
      (session as any).accessToken = (token as any).access_token as string | undefined;
      return session;
    },
  },
};

async function refreshGoogleAccessToken(refreshToken?: string) {
  if (!refreshToken) return null;
  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID || "",
    client_secret: process.env.GOOGLE_CLIENT_SECRET || "",
    grant_type: "refresh_token",
    refresh_token: refreshToken,
  });
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: params.toString(),
  });
  if (!res.ok) throw new Error("Failed to refresh token");
  return (await res.json()) as {
    access_token: string;
    expires_in: number;
    scope?: string;
    token_type?: string;
  };
}
