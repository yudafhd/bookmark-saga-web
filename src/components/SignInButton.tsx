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
      className="inline-flex items-center gap-3 rounded-lg bg-white px-5 py-3 sm:px-6 font-medium text-zinc-900 hover:bg-zinc-200"
    >
      <FiLogIn /> Sign in with Google
    </button>
  );
}
