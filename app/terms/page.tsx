import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "Terms of Service for Footymedia.",
};

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <h1 className="font-serif text-3xl font-black">Terms of Service</h1>
      <p className="mt-2 text-sm text-neutral-500">Last updated: 2026</p>

      <div className="prose-afh mt-6">
        <h2>Use of this site</h2>
        <p>
          Footymedia provides football news, scores and analysis for
          informational purposes. Content is provided &quot;as is&quot;
          without warranty of accuracy or completeness. Scores, fixtures and
          statistics should be verified against official sources before
          being relied upon.
        </p>

        <h2>Comments</h2>
        <p>
          By posting a comment, you agree not to submit content that is
          abusive, defamatory, spam, or otherwise unlawful. We reserve the
          right to remove any comment at our discretion.
        </p>

        <h2>External links</h2>
        <p>
          This site may contain links to third-party websites, including
          promotional or affiliate links. We are not responsible for the
          content or practices of external sites.
        </p>

        <h2>Changes</h2>
        <p>
          These terms may be updated from time to time. Continued use of
          the site after changes constitutes acceptance of the updated
          terms.
        </p>

        <h2>Contact</h2>
        <p>
          Questions about these terms can be sent through our{" "}
          <a href="/contact">Contact page</a>.
        </p>
      </div>
    </div>
  );
}
