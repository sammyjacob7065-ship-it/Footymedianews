"use client";

import { useEffect, useState } from "react";
import { upload } from "@vercel/blob/client";

export default function YoutubePostTestPage() {
  const [token, setToken] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [status, setStatus] = useState<
    "idle" | "uploading" | "posting" | "done" | "error"
  >("idle");
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState("");

  useEffect(() => {
    const saved = localStorage.getItem("afm-posting-key");
    if (saved) setToken(saved);
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!videoFile) return;
    setResult("");
    setProgress(0);

    try {
      setStatus("uploading");
      const blob = await upload(videoFile.name, videoFile, {
        access: "public",
        handleUploadUrl: "/api/tiktok/blob-upload",
        clientPayload: token,
        onUploadProgress: ({ percentage }) => setProgress(percentage),
      });

      setStatus("posting");
      const postRes = await fetch("/api/youtube/post-video", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-api-token": token },
        body: JSON.stringify({ video_url: blob.url, title, description }),
      });
      const postData = await postRes.json();
      if (!postRes.ok)
        throw new Error(JSON.stringify(postData.details || postData.error));

      setStatus("done");
      setResult(`Uploaded! Watch it here: ${postData.video_url}`);
    } catch (err) {
      setStatus("error");
      setResult(err instanceof Error ? err.message : "Something went wrong");
    }
  }

  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <h1 className="font-serif text-2xl font-black">Post a video to YouTube</h1>

      <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
        <input
          type="password"
          value={token}
          onChange={(e) => setToken(e.target.value)}
          placeholder="Posting key"
          required
          className="rounded-md border border-neutral-300 dark:border-neutral-700 bg-transparent px-3 py-2 text-sm"
        />
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Video title"
          required
          className="rounded-md border border-neutral-300 dark:border-neutral-700 bg-transparent px-3 py-2 text-sm"
        />
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Description (optional)"
          rows={3}
          className="rounded-md border border-neutral-300 dark:border-neutral-700 bg-transparent px-3 py-2 text-sm"
        />
        <input
          type="file"
          accept="video/mp4,video/quicktime"
          onChange={(e) => setVideoFile(e.target.files?.[0] ?? null)}
          required
          className="text-sm"
        />
        <button
          type="submit"
          disabled={status === "uploading" || status === "posting"}
          className="self-start rounded-md bg-red-600 px-5 py-2.5 text-sm font-bold text-white disabled:opacity-50"
        >
          {status === "uploading"
            ? `Uploading… ${progress}%`
            : status === "posting"
            ? "Sending to YouTube…"
            : "Upload & Post"}
        </button>
        {result && (
          <pre className="whitespace-pre-wrap rounded-md border border-neutral-200 dark:border-neutral-800 p-3 text-xs">
            {result}
          </pre>
        )}
      </form>
    </div>
  );
}
