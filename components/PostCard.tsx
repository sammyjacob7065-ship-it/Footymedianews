import Image from "next/image";
import Link from "next/link";
import { format } from "date-fns";
import type { PostSummary } from "@/lib/posts";

export default function PostCard({ post }: { post: PostSummary }) {
  return (
    <Link
      href={`/posts/${post.slug}`}
      className="group flex flex-col overflow-hidden rounded-lg border border-neutral-200 dark:border-neutral-800 transition-colors hover:border-afh-green"
    >
      <div className="relative aspect-[16/9] w-full overflow-hidden bg-neutral-100 dark:bg-neutral-900">
        <Image
          src={post.image}
          alt={post.title}
          fill
          sizes="(min-width: 768px) 33vw, 100vw"
          className="object-cover transition-transform duration-200 group-hover:scale-105"
        />
      </div>
      <div className="flex flex-1 flex-col gap-2 p-4">
        <span className="text-xs font-bold uppercase tracking-wide text-afh-green">
          {post.category}
        </span>
        <h3 className="font-serif text-lg font-bold leading-snug">
          {post.title}
        </h3>
        <p className="line-clamp-2 text-sm text-neutral-600 dark:text-neutral-400">
          {post.excerpt}
        </p>
        <span className="mt-auto pt-2 text-xs text-neutral-400">
          {format(new Date(post.date), "MMM d, yyyy")}
        </span>
      </div>
    </Link>
  );
}
