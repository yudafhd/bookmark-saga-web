"use client";
import { signOut } from "next-auth/react";
import { FiLogOut } from "react-icons/fi";

export default function SignOutButton() {
  const onClick = () => {
    void signOut({ callbackUrl: "/" });
  };

  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-2 md:rounded-lg md:border md:border-white/10 md:bg-white/5 px-3 py-2 text-xs md:text-sm text-zinc-200 md:hover:bg-white/10"
      aria-label="Sign out"
    >
      <FiLogOut className="text-lg" />
      <span className="hidden md:block">
        Logout
      </span>
    </button>
  );
}

