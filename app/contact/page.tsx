import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact",
  description: "Get in touch with Footymedia.",
};

export default function ContactPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <h1 className="font-serif text-3xl font-black">Get in touch</h1>
      <p className="mt-3 text-neutral-600 dark:text-neutral-400">
        Spotted an error, have a tip, or want to partner with us? Send an
        email and we&apos;ll get back to you.
      </p>
      <a
        href="mailto:Samsonjacob7065@gmail.com"
        className="mt-6 inline-flex items-center gap-2 rounded-md bg-afh-green px-5 py-3 text-sm font-bold text-white hover:opacity-90"
      >
        Email Samsonjacob7065@gmail.com
      </a>
    </div>
  );
}
