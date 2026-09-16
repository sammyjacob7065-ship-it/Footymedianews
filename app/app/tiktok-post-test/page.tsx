"use client";

import { useEffect, useState } from "react";
import { upload } from "@vercel/blob/client";

export default function TikTokPostTestPage() {
  const [token, setToken] = useState("");
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [status, setStatus] = useState<
    "idle" | "uploading" | "posting" | "done" | "error"
  >("idle");
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<string>("");

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
      const postRes = await fetch("/api/tiktok/post-video", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-api-token": token },
        body: JSON.stringify({ video_url: blob.url }),
      });
      const postData = await postRes.json();
      if (!postRes.ok)
        throw new Error(JSON.stringify(postData.details || postData.error));

      setStatus("done");
      setResult(
        `Sent to your TikTok inbox as a draft. publish_id: ${postData.publish_id}\n\nVideo URL used: ${blob.url}\n\nOpen the TikTok app and check your inbox notifications to finish posting.`
      );
    } catch (err) {
      setStatus("error");
      setResult(err instanceof Error ? err.message : "Something went wrong");
    }
  }

  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <h1 className="font-serif text-2xl font-black">Post a video to TikTok</h1>
      <p className="mt-2 text-sm text-neutral-500">
        Uploads a video to your site, then sends it to your connected
        TikTok account&apos;s inbox as a draft.
      </p>

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
          type="file"
          accept="video/mp4,video/quicktime"
          onChange={(e) => setVideoFile(e.target.files?.[0] ?? null)}
          required
          className="text-sm"
        />
        <button
          type="submit"
          disabled={status === "uploading" || status === "posting"}
          className="self-start rounded-md bg-afh-green px-5 py-2.5 text-sm font-bold text-white disabled:opacity-50"
        >
          {status === "uploading"
            ? `Uploading… ${progress}%`
            : status === "posting"
            ? "Sending to TikTok…"
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
