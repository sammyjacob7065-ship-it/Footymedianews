import { notFound } from "next/navigation";
import Image from "next/image";
import type { Metadata } from "next";
import { format } from "date-fns";
import { MDXRemote } from "next-mdx-remote/rsc";
import { getAllSlugs, getPostBySlug } from "@/lib/posts";
import AdSense from "@/components/AdSense";
import PromoBox from "@/components/PromoBox";
import Comments from "@/components/Comments";

export function generateStaticParams() {
  return getAllSlugs().map((slug) => ({ slug }));
}

// Re-render this page in the background at most once a minute, so new
// comments show up without needing a full redeploy.
export const revalidate = 60;

export function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Metadata {
  const post = getPostBySlug(params.slug);
  if (!post) return {};
  const { frontmatter } = post;
  return {
    title: frontmatter.title,
    description: frontmatter.excerpt,
    openGraph: {
      title: frontmatter.title,
      description: frontmatter.excerpt,
      images: [frontmatter.image],
      type: "article",
      publishedTime: frontmatter.date,
    },
    twitter: {
      card: "summary_large_image",
      title: frontmatter.title,
      description: frontmatter.excerpt,
      images: [frontmatter.image],
    },
  };
}

export default function PostPage({ params }: { params: { slug: string } }) {
  const post = getPostBySlug(params.slug);
  if (!post) notFound();

  const { frontmatter, content } = post;

  const schema = {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    headline: frontmatter.title,
    image: [frontmatter.image],
    datePublished: frontmatter.date,
    author: [{ "@type": "Organization", name: "Footymedia" }],
    description: frontmatter.excerpt,
  };

  return (
    <article className="mx-auto max-w-3xl px-4 py-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />

      <p className="mb-2 text-xs font-bold uppercase tracking-wide text-afh-green">
        {frontmatter.category}
      </p>
      <h1 className="font-serif text-3xl font-black leading-tight sm:text-4xl">
        {frontmatter.title}
      </h1>
      <p className="mt-3 text-sm text-neutral-500">
        By Footymedia &middot;{" "}
        {format(new Date(frontmatter.date), "MMMM d, yyyy")}
      </p>

      <div className="relative my-6 aspect-[16/9] w-full overflow-hidden rounded-lg bg-neutral-100 dark:bg-neutral-900">
        <Image
          src={frontmatter.image}
          alt={frontmatter.title}
          fill
          priority
          className="object-cover"
        />
      </div>

      <div className="prose-afh">
        <MDXRemote source={content} />
      </div>

      <PromoBox />

      <AdSense slot="article" />

      <Comments slug={post.slug} />
    </article>
  );
}
