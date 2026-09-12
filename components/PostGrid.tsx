import PostCard from "./PostCard";
import AdSense from "./AdSense";
import type { PostSummary } from "@/lib/posts";
import { Fragment } from "react";

export default function PostGrid({ posts }: { posts: PostSummary[] }) {
  if (posts.length === 0) {
    return (
      <p className="py-12 text-center text-neutral-500">
        No posts yet — check back soon.
      </p>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {posts.map((post, i) => (
        <Fragment key={post.slug}>
          <PostCard post={post} />
          {/* mid-feed ad every 6 posts */}
          {(i + 1) % 6 === 0 && (
            <div className="sm:col-span-2 lg:col-span-3">
              <AdSense slot="feed" />
            </div>
          )}
        </Fragment>
      ))}
    </div>
  );
}
