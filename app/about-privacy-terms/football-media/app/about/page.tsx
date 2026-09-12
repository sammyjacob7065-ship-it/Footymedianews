import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About",
  description: "About Footymedia.",
};

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <h1 className="font-serif text-3xl font-black">About Footymedia</h1>
      <div className="mt-4 flex flex-col gap-4 text-neutral-700 dark:text-neutral-300">
        <p>
          Footymedia covers football news, transfers, fixtures and results
          across the Premier League, Champions League, La Liga, Europa
          League and Serie A.
        </p>
        <p>
          Our coverage combines automated news monitoring with editorial
          write-ups, so the latest match reports, transfer news and injury
          updates reach readers quickly.
        </p>
        <p>
          Have a correction, a tip, or want to get in touch? Visit our{" "}
          <a href="/contact" className="text-afh-green underline">
            Contact page
          </a>
          .
        </p>
      </div>
    </div>
  );
}
