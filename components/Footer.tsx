export default function Footer() {
  return (
    <footer className="mt-16 border-t border-neutral-200 dark:border-neutral-800">
      <div className="mx-auto max-w-5xl px-4 py-8 text-sm text-neutral-500">
        <p>&copy; {new Date().getFullYear()} Footymedia. All rights reserved.</p>
        <nav className="mt-2 flex gap-4">
          <a href="/about" className="underline hover:text-afh-green">About</a>
          <a href="/contact" className="underline hover:text-afh-green">Contact</a>
          <a href="/privacy" className="underline hover:text-afh-green">Privacy Policy</a>
          <a href="/terms" className="underline hover:text-afh-green">Terms</a>
          <a href="/feed.xml" className="underline hover:text-afh-green">RSS feed</a>
        </nav>
      </div>
    </footer>
  );
}
