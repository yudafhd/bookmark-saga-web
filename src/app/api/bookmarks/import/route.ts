import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth.config";
import { Bookmark, writeBookmarks } from "@/lib/drive";

export const runtime = "nodejs";

function isBookmarkArray(data: unknown): data is Bookmark[] {
  if (!Array.isArray(data)) return false;
  return data.every((it) =>
    it &&
    typeof it === "object" &&
    typeof (it as { id?: unknown }).id === "string" &&
    typeof (it as { title?: unknown }).title === "string" &&
    typeof (it as { url?: unknown }).url === "string" &&
    typeof (it as { savedAt?: unknown }).savedAt === "string"
  );
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  let accessToken: string | null = null;
  if (typeof session === "object" && session && "accessToken" in session) {
    const v = (session as { accessToken?: unknown }).accessToken;
    if (typeof v === "string") accessToken = v;
  }
  if (!accessToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const data = body && ("bookmarks" in body ? (body as { bookmarks: unknown }).bookmarks : body);

  if (!isBookmarkArray(data)) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  await writeBookmarks(accessToken, data);
  return NextResponse.json({ ok: true, count: data.length });
}

