import { getServerSession } from "next-auth";
import { authOptions } from "./auth.config";

export async function auth() {
  return getServerSession(authOptions);
}

export type ExtendedSession = {
  user?: { name?: string | null; email?: string | null; image?: string | null };
  accessToken?: string;
};
