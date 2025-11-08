"use client";
import { signIn } from "next-auth/react";
import { FiLogIn } from "react-icons/fi";

export default function SignInButton() {
  const handleClick = () => {
    void signIn("google", { callbackUrl: "/bookmarks", prompt: "consent" });
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className="inline-flex items-center gap-3 rounded-lg text-xs md:text-base p-1 px-2 md:px-4 md:py-2 bg-white font-medium text-zinc-900 hover:bg-zinc-200"
    >
      <FiLogIn /> Sign in with Google
    </button>
  );
}
