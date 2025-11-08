"use client";

import { useRef, useState } from "react";
import { FiMoreVertical } from "react-icons/fi";

export default function BookmarksMenu() {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  return (
    <div ref={containerRef} className="relative hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="rounded-md p-1.5 text-zinc-400 hover:bg-white/5"
        aria-label="Open menu"
      >
        <FiMoreVertical className="text-zinc-400" />
      </button>

      {open && (
        <div className="absolute right-0 z-20 mt-2 w-40 rounded-lg border border-white/10 bg-[#111826]/95 p-1.5 text-sm shadow-lg backdrop-blur">
          <button
            type="button"
            onClick={() => {
              setOpen(false);
              window.location.reload();
            }}
            className="w-full rounded-md px-3 py-2 text-left text-zinc-200 hover:bg-white/5"
          >
            Refresh
          </button>
        </div>
      )}
    </div>
  );
}
