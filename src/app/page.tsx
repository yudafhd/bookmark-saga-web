import { auth } from "@/auth";
import SignInButton from "@/components/SignInButton";
import { readBookmarks } from "@/lib/drive";
import BookmarksView from "@/components/BookmarksView";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export default async function Home() {
  const session = await auth();
  const accessToken = (session as any)?.accessToken as string | undefined;

  if (!accessToken) {
    return (
      <div className="min-h-[100svh] bg-gradient-to-b from-[#0e1525] to-[#0a0f1e] font-sans text-zinc-100 flex items-center justify-center px-4 sm:px-8">
        <main className="w-full max-w-6xl flex flex-col items-center gap-2 md:gap-10 py-16 sm:py-24 text-center">
          <div className="relative inline-block">
            <h1 className="text-[42px] sm:text-[64px] md:text-[88px] lg:text-[120px] font-extrabold leading-none tracking-tight text-zinc-200">
              Bookmark
            </h1>
            <span className="absolute -top-5 right-1 text-lg sm:-top-4 sm:right-2 sm:text-2xl md:-top-5 md:right-3 md:text-3xl font-semibold">
              saga
            </span>
          </div>

          <div className="w-full flex justify-center">
            <SignInButton />
          </div>
          <div className="text-xs text-zinc-200">
            by {" "}
            <a target="_blank" href="https://yudafhd.com">
              @yudafhd
            </a>
          </div>
        </main>
      </div>
    );
  }

  let bookmarks = [] as Awaited<ReturnType<typeof readBookmarks>>;
  try {
    bookmarks = await readBookmarks(accessToken);
  } catch (e) {
    console.error("Failed to read bookmarks from Drive AppData", e);
  }

  return (
    <div className="min-h-[100svh] min-w-screen bg-gradient-to-b from-[#0e1525] to-[#0a0f1e] text-zinc-100">
      <BookmarksView bookmarks={bookmarks} />
    </div>
  );
}
