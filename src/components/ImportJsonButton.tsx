"use client";
import { useRef } from "react";
import { FiUpload } from "react-icons/fi";
import type { Bookmark } from "@/lib/drive";
import { tryExtractBookmarks } from "@/lib/extract";

export default function ImportJsonButton() {
  const inputRef = useRef<HTMLInputElement | null>(null);

  const onClick = () => inputRef.current?.click();

  const onFileChange: React.ChangeEventHandler<HTMLInputElement> = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const parsed = JSON.parse(text) as unknown;

      let bookmarks: Bookmark[] | null = tryExtractBookmarks(parsed);
      if (!bookmarks) {
        if (Array.isArray(parsed)) {
          bookmarks = parsed as Bookmark[];
        } else if (parsed && typeof parsed === "object" && "bookmarks" in parsed) {
          bookmarks = (parsed as { bookmarks: Bookmark[] }).bookmarks;
        }
      }
      if (!bookmarks) throw new Error("Invalid JSON structure");

      const res = await fetch("/api/bookmarks/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookmarks }),
      });
      if (!res.ok) {
        const info = await res.json().catch(() => ({}));
        throw new Error(info.error || `Failed (${res.status})`);
      }
      // refresh the page
      window.location.reload();
    } catch (err) {
      console.error(err);
      alert((err as Error).message);
    } finally {
      if (e.target) e.target.value = "";
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={onClick}
        className="!hidden inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-zinc-200 hover:bg-white/10"
        aria-label="Import JSON to appData"
      >
        <FiUpload /> Import JSON
      </button>
      <input ref={inputRef} type="file" accept="application/json,.json" onChange={onFileChange} className="hidden" />
    </>
  );
}

