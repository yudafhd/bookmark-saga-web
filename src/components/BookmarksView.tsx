"use client";

import { useEffect, useMemo, useState } from "react";
import type { Bookmark } from "@/lib/drive";
import { buildFolderTree, flattenFolders, normalizePath } from "@/lib/folders";
import BookmarksMenu from "@/components/BookmarksMenu";
import SignOutButton from "@/components/SignOutButton";
import ImportJsonButton from "@/components/ImportJsonButton";
import { FiFolder, FiSearch, FiExternalLink, FiMenu, FiX, FiUpload, FiHome } from "react-icons/fi";
import { filterByQuery } from "@/lib/function";

export default function BookmarksView({ bookmarks }: { bookmarks: Bookmark[] }) {
  const [selected, setSelected] = useState<string | undefined>(undefined);
  const [showSidebar, setShowSidebar] = useState(false);
  const [query, setQuery] = useState<string>()

  const { folders, visible } = useMemo(() => {
    const tree = buildFolderTree(bookmarks);
    const all = flattenFolders(tree);
    const selectedFolder = selected ? normalizePath(selected) : undefined;
    const list = selectedFolder
      ? bookmarks.filter((b) => {
        const tagNorm = normalizePath(String(b.tags?.[0] || "Unsorted"));
        return tagNorm === selectedFolder || tagNorm.startsWith(`${selectedFolder}/`);
      })
      : bookmarks;

    return { folders: all, visible: filterByQuery<Bookmark>(list, query) };

  }, [bookmarks, selected, query]);

  useEffect(() => {
    let scrollY = 0;

    if (showSidebar) {
      scrollY = window.scrollY;
      document.body.style.position = "fixed";
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = "100%";
    } else {
      const y = document.body.style.top;
      document.body.style.position = "";
      document.body.style.top = "";
      document.body.style.width = "";
      if (y) window.scrollTo(0, -parseInt(y || "0", 10));
    }

    return () => {
      document.body.style.position = "";
      document.body.style.top = "";
      document.body.style.width = "";
    };
  }, [showSidebar]);

  return (
    <div className="mx-auto flex max-w-7xl gap-6 px-4 sm:px-6 py-4 sm:py-8">

      {/* Main content */}
      <main className="flex-1 pb-20 md:pb-0">
        {/* Mobile topbar */}
        <div className="mb-4 flex items-center justify-between gap-3 md:hidden">
          <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-2 text-sm text-zinc-300 flex-1">
            <FiSearch className="text-zinc-400" />
            <input
              placeholder="Search..."
              value={query || ""}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full bg-transparent outline-none placeholder:text-zinc-500"
            />
          </div>
          <div className="hidden md:block">
            <SignOutButton />
          </div>
        </div>

        {/* Desktop header */}
        <div className="mb-6 hidden items-center justify-between gap-4 md:flex">
          <div className="flex gap-2">
            <h1 className="text-3xl font-extrabold">Bookmark</h1>
            <span className="text-sm opacity-40">saga</span>

          </div>
          <div className="flex items-center gap-3">
            <div className="items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-zinc-300 md:flex hidden">
              <FiSearch className="text-zinc-400" />
              <input
                placeholder="Search bookmarks..."
                onChange={event => setQuery(event.target.value)}
                className="w-72 bg-transparent outline-none placeholder:text-zinc-500"
              />
            </div>
            <ImportJsonButton />
            <SignOutButton />
          </div>
        </div>

        <div className="w-full flex gap-3">
          <aside className="hidden md:block w-74 shrink-0 md:top-24 h-fit rounded-xl border border-white/5 bg-white/5 p-4">
            <div className="mb-3 flex items-center justify-between px-2">
              <span className="text-sm font-medium tracking-wide text-zinc-300">BOOKMARKS</span>
              <BookmarksMenu />
            </div>
            <nav className="space-y-1">
              <button
                type="button"
                onClick={() => setSelected(undefined)}
                className={`group flex w-full items-center justify-between rounded-lg px-3 py-2 ${!selected ? "bg-white/[0.06] text-zinc-100" : "text-zinc-300 hover:bg-white/[0.04]"}`}
              >
                <span className="flex items-center gap-3">
                  <FiFolder className="text-zinc-400" />
                  <span>All items</span>
                </span>
                <span className="text-xs text-zinc-500">{bookmarks.length}</span>
              </button>
              {folders.map((f) => (
                <button
                  type="button"
                  key={f.path}
                  onClick={() => setSelected(f.path)}
                  className={`group flex w-full items-center justify-between rounded-lg px-3 py-2 ${selected === f.path ? "bg-white/[0.06] text-zinc-100" : "text-zinc-300 hover:bg-white/[0.04]"}`}
                  style={{ paddingLeft: `${12 + f.depth * 16}px` }}
                >
                  <span className="flex items-center gap-3 truncate">
                    <FiFolder className="text-zinc-400 shrink-0" />
                    <span className="truncate">{f.name}</span>
                  </span>
                  <span className="text-xs text-zinc-500">{f.count}</span>
                </button>
              ))}
            </nav>
          </aside>
          <ul className="space-y-3 w-full max-w-full overflow-x-hidden">
            {visible.length === 0 && (
              <li className="rounded-xl border border-white/10 bg-white/5 p-6 text-zinc-400">
                No bookmarks yet. Save your data to your Google Drive appData.
              </li>
            )}

            {visible.map((b) => (
              <div key={b.id}>
                <a
                  href={b.url}
                  target="_blank"
                  rel="noreferrer"
                >
                  <li
                    className="
                    w-full max-w-full overflow-hidden
                    flex flex-col sm:flex-row
                    sm:items-center sm:justify-between
                    gap-3
                    rounded-xl border border-white/10 bg-white/5
                    p-2 px-4
                    hover:bg-white/[0.06]
                  "
                  >
                    <div className="flex min-w-0 flex-1 items-center gap-3 sm:gap-4">
                      <div className="size-8 flex-none overflow-hidden rounded bg-white/10">
                        {b.faviconUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={b.faviconUrl}
                            alt="favicon"
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-sm text-zinc-400">
                            {(() => {
                              try {
                                return new URL(b.url).hostname[0]?.toUpperCase();
                              } catch {
                                return "?";
                              }
                            })()}
                          </div>
                        )}
                      </div>
                      <div className="min-w-0 w-full max-w-full">
                        <div className="font-medium text-zinc-100 break-words line-clamp-2">
                          {b.title}
                        </div>
                        <div className="text-sm text-zinc-400 break-all">
                          {b.domain ??
                            (() => {
                              try {
                                return new URL(b.url).hostname;
                              } catch {
                                return b.url;
                              }
                            })()}{" "}
                          · Saved {new Date(b.savedAt).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  </li>
                </a>
              </div>
            ))}
          </ul>

        </div>
      </main>
      {/* Mobile drawer for folders */}
      {showSidebar && (
        <div className="md:hidden fixed inset-0 z-50">
          {/* overlay */}
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setShowSidebar(false)}
          />

          {/* panel glass */}
          <div
            className="
            absolute inset-y-0 left-0
            w-72 max-w-[85%]
            border-r border-white/20
            bg-gradient-to-b from-white/15 via-white/10 to-white/5
            backdrop-blur-xl
            shadow-[0_0_40px_rgba(0,0,0,0.6)]
            p-4
          "
          >
            <div className="mb-3 flex items-center justify-between px-1">
              <span className="text-sm font-medium tracking-wide text-zinc-100 drop-shadow">
                BOOKMARKS
              </span>
              <button
                onClick={() => setShowSidebar(false)}
                className="rounded-md p-1.5 text-zinc-200 hover:bg-white/10"
                aria-label="Close"
              >
                <FiX />
              </button>
            </div>

            <nav className="space-y-1">
              <button
                type="button"
                onClick={() => { setSelected(undefined); setShowSidebar(false); }}
                className={`group flex w-full items-center justify-between rounded-lg px-3 py-2 ${!selected ? "bg-white/[0.06] text-zinc-100" : "text-zinc-300 hover:bg-white/[0.04]"}`}
              >
                <span className="flex items-center gap-3">
                  <FiFolder className="text-zinc-400" />
                  <span>All items</span>
                </span>
                <span className="text-xs text-zinc-500">{bookmarks.length}</span>
              </button>
              {folders.map((f) => (
                <button
                  type="button"
                  key={f.path}
                  onClick={() => { setSelected(f.path); setShowSidebar(false); }}
                  className={`group flex w-full items-center justify-between rounded-lg px-3 py-2 ${selected === f.path ? "bg-white/[0.06] text-zinc-100" : "text-zinc-300 hover:bg-white/[0.04]"}`}
                  style={{ paddingLeft: `${12 + f.depth * 16}px` }}
                >
                  <span className="flex items-center gap-3 truncate">
                    <FiFolder className="text-zinc-400 shrink-0" />
                    <span className="truncate">{f.name}</span>
                  </span>
                  <span className="text-xs text-zinc-500">{f.count}</span>
                </button>
              ))}
            </nav>
          </div>
        </div>
      )}

      {/* Bottom navigation (mobile) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 border-t border-white/10 bg-[#0e1525]/95 backdrop-blur px-6 py-2">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <button
            type="button"
            onClick={() => setSelected(undefined)}
            className={`flex flex-col items-center gap-1 text-[11px] ${!selected ? "text-zinc-100" : "text-zinc-300"}`}
          >
            <FiHome className="text-lg" />
          </button>
          <button
            type="button"
            onClick={() => setShowSidebar(true)}
            className="flex flex-col items-center gap-1 text-[11px] text-zinc-300"
          >
            <FiFolder className="text-lg" />
          </button>
          <SignOutButton />
        </div>
      </nav>

    </div>
  );
}
