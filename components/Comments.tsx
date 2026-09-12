import { getComments, commentsConfigured } from "@/lib/comments";
import { format } from "date-fns";
import CommentForm from "./CommentForm";

export default async function Comments({ slug }: { slug: string }) {
  if (!commentsConfigured()) {
    return (
      <section className="mt-10 border-t border-neutral-200 dark:border-neutral-800 pt-6">
        <h2 className="font-serif text-lg font-bold mb-2">Comments</h2>
        <p className="text-sm text-neutral-400">
          Comments aren&apos;t set up yet.
        </p>
      </section>
    );
  }

  const comments = await getComments(slug);

  return (
    <section className="mt-10 border-t border-neutral-200 dark:border-neutral-800 pt-6">
      <h2 className="font-serif text-lg font-bold mb-4">
        Comments {comments.length > 0 && `(${comments.length})`}
      </h2>

      {comments.length === 0 ? (
        <p className="text-sm text-neutral-400">
          No comments yet — be the first to say something.
        </p>
      ) : (
        <ul className="flex flex-col gap-4">
          {comments.map((c) => (
            <li
              key={c.id}
              className="rounded-md border border-neutral-200 dark:border-neutral-800 p-3"
            >
              <div className="flex items-baseline justify-between">
                <span className="text-sm font-bold">{c.name}</span>
                <span className="text-xs text-neutral-400">
                  {format(new Date(c.created_at), "MMM d, yyyy")}
                </span>
              </div>
              <p className="mt-1 text-sm text-neutral-700 dark:text-neutral-300">
                {c.body}
              </p>
            </li>
          ))}
        </ul>
      )}

      <CommentForm slug={slug} />
    </section>
  );
}
