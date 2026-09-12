export default function Footer() {
  return (
    <footer className="mt-16 border-t border-neutral-200 dark:border-neutral-800">
      <div className="mx-auto max-w-5xl px-4 py-8 text-sm text-neutral-500">
        <p>&copy; {new Date().getFullYear()} Footymedia. All rights reserved.</p>
        <p className="mt-1">
          <a href="/feed.xml" className="underline hover:text-afh-green">RSS feed</a>
        </p>
      </div>
    </footer>
  );
}
