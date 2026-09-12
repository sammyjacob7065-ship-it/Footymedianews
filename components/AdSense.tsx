"use client";

import { useEffect } from "react";

/**
 * Real AdSense slot. Once your AdSense account is approved:
 *  1. Add NEXT_PUBLIC_ADSENSE_CLIENT (looks like "ca-pub-1234567890123456")
 *     as an environment variable in Vercel.
 *  2. Create an ad unit for each slot in your AdSense dashboard and add
 *     its ID as NEXT_PUBLIC_ADSENSE_SLOT_HEADER / _FEED / _ARTICLE.
 *  3. Redeploy. The real ad renders automatically — no code changes needed.
 *
 * Until those env vars exist, this shows the dashed placeholder box so
 * layout still looks right in the meantime.
 */

declare global {
  interface Window {
    adsbygoogle: unknown[];
  }
}

const SLOT_ENV: Record<"header" | "feed" | "article", string | undefined> = {
  header: process.env.NEXT_PUBLIC_ADSENSE_SLOT_HEADER,
  feed: process.env.NEXT_PUBLIC_ADSENSE_SLOT_FEED,
  article: process.env.NEXT_PUBLIC_ADSENSE_SLOT_ARTICLE,
};

const SIZES: Record<"header" | "feed" | "article", string> = {
  header: "h-[90px] w-full max-w-[728px]",
  feed: "h-[250px] w-full",
  article: "h-[250px] w-full max-w-[336px]",
};

export default function AdSense({
  slot,
}: {
  slot: "header" | "feed" | "article";
}) {
  const client = process.env.NEXT_PUBLIC_ADSENSE_CLIENT;
  const slotId = SLOT_ENV[slot];
  const isLive = Boolean(client && slotId);

  useEffect(() => {
    if (!isLive) return;
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch {
      // AdSense script not loaded yet — safe to ignore
    }
  }, [isLive]);

  if (!isLive) {
    return (
      <div
        className={`mx-auto flex items-center justify-center rounded border border-dashed border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-900 text-xs text-neutral-400 ${SIZES[slot]}`}
      >
        Ad slot — {slot} (inactive — add AdSense env vars)
      </div>
    );
  }

  return (
    <ins
      className={`adsbygoogle mx-auto block ${SIZES[slot]}`}
      data-ad-client={client}
      data-ad-slot={slotId}
      data-ad-format="auto"
      data-full-width-responsive="true"
    />
  );
}
