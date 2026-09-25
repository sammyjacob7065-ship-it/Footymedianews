"use client";

import { useState } from "react";

export default function YoutubeLoginPage() {
  const [channel, setChannel] = useState("football");
  const [customChannel, setCustomChannel] = useState("");

  const finalChannel = channel === "custom" ? customChannel.trim() : channel;
  const loginUrl =
    "/api/youtube/login?channel=" +
    encodeURIComponent(finalChannel || "default");

  return (
    <div className="mx-auto max-w-md px-4 py-16 text-center">
      <h1 className="font-serif text-2xl font-black">Connect YouTube</h1>
      <p className="mt-2 text-sm text-neutral-500">
        Choose which channel you&apos;re connecting, then authorize it.
      </p>

      <div className="mt-6 flex flex-col gap-2 text-left">
        <label className="flex items-center gap-2 text-sm">
          <input
            type="radio"
            checked={channel === "football"}
            onChange={() => setChannel("football")}
          />
          Football channel
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="radio"
            checked={channel === "ai"}
            onChange={() => setChannel("ai")}
          />
          AI videos channel
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="radio"
            checked={channel === "custom"}
            onChange={() => setChannel("custom")}
          />
          Other:
          <input
            type="text"
            value={customChannel}
            onChange={(e) => setCustomChannel(e.target.value)}
            placeholder="channel-name"
            className="flex-1 rounded border border-neutral-300 dark:border-neutral-700 bg-transparent px-2 py-1 text-sm"
          />
        </label>
      </div>

      
        href={loginUrl}
        className="mt-6 inline-block rounded-md bg-red-600 px-6 py-3 text-sm font-bold text-white hover:opacity-90"
      >
        Continue with Google
      </a>
    </div>
  );
}
