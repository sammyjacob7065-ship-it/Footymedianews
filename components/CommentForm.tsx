"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function CommentForm({ slug }: { slug: string }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [comment, setComment] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "error">("idle");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !comment.trim()) return;
    setStatus("sending");

    const res = await fetch("/api/comments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slug, name, comment, website: "" }),
    });

    if (res.ok) {
      setName("");
      setComment("");
      setStatus("idle");
      router.refresh();
    } else {
      setStatus("error");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-3">
      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Your name"
        maxLength={60}
        required
        className="rounded-md border border-neutral-300 dark:border-neutral-700 bg-transparent px-3 py-2 text-sm outline-none focus:border-afh-green"
      />
      <textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        placeholder="Write a comment…"
        maxLength={1000}
        required
        rows={3}
        className="rounded-md border border-neutral-300 dark:border-neutral-700 bg-transparent px-3 py-2 text-sm outline-none focus:border-afh-green"
      />
      <button
        type="submit"
        disabled={status === "sending"}
        className="self-start rounded-md bg-afh-green px-4 py-2 text-sm font-bold text-white hover:opacity-90 disabled:opacity-50"
      >
        {status === "sending" ? "Posting…" : "Post comment"}
      </button>
      {status === "error" && (
        <p className="text-xs text-red-500">
          Couldn&apos;t post your comment — please try again.
        </p>
      )}
    </form>
  );
}
