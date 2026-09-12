import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "Privacy Policy for Footymedia.",
};

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <h1 className="font-serif text-3xl font-black">Privacy Policy</h1>
      <p className="mt-2 text-sm text-neutral-500">Last updated: 2026</p>

      <div className="prose-afh mt-6">
        <h2>Information we collect</h2>
        <p>
          When you leave a comment on an article, we store the name and
          comment text you provide, along with the time it was posted.
          We do not require an account or email address to comment.
        </p>

        <h2>Cookies and analytics</h2>
        <p>
          Footymedia may use cookies for basic site functionality, such as
          remembering your dark mode preference. If advertising is enabled
          on this site, our advertising partner (Google AdSense) may use
          cookies to serve relevant ads. You can control cookie preferences
          through your browser settings.
        </p>

        <h2>Third-party advertising</h2>
        <p>
          This site may display advertisements served by Google AdSense.
          Google may use cookies to serve ads based on your visits to this
          site and other sites on the internet. You can opt out of
          personalized advertising by visiting Google&apos;s Ads Settings.
        </p>

        <h2>Comments</h2>
        <p>
          Comments are public and visible to all visitors. Please don&apos;t
          include personal information you don&apos;t want made public in a
          comment.
        </p>

        <h2>Contact</h2>
        <p>
          Questions about this policy can be sent through our{" "}
          <a href="/contact">Contact page</a>.
        </p>
      </div>
    </div>
  );
}
