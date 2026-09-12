import Hero from "@/components/Hero";
import PostGrid from "@/components/PostGrid";
import AdSense from "@/components/AdSense";
import { getPostsByCategory, searchPosts } from "@/lib/posts";

export default function HomePage({
  searchParams,
}: {
  searchParams: { category?: string; q?: string };
}) {
  const allPosts = searchParams.q
    ? searchPosts(searchParams.q)
    : searchParams.category
    ? getPostsByCategory(searchParams.category)
    : searchPosts("");

  const latest = allPosts.slice(0, 9);

  return (
    <>
      <Hero />
      <div className="mx-auto max-w-5xl px-4 pt-6">
        <AdSense slot="header" />
      </div>
      <div className="mx-auto max-w-5xl px-4 py-8">
        {searchParams.q && (
          <h2 className="mb-4 font-serif text-xl font-bold">
            Results for &ldquo;{searchParams.q}&rdquo;
          </h2>
        )}
        {searchParams.category && !searchParams.q && (
          <h2 className="mb-4 font-serif text-xl font-bold">
            {searchParams.category}
          </h2>
        )}
        <PostGrid posts={latest} />
      </div>
    </>
  );
}
