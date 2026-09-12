import Link from "next/link";
import DarkModeToggle from "./DarkModeToggle";

const CATEGORIES = [
  "Premier League",
  "Champions League",
  "La Liga",
  "Europa League",
  "Serie A",
];

export default function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-neutral-200 dark:border-neutral-800 bg-white/90 dark:bg-afh-dark/90 backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
        <Link href="/" className="flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-md bg-afh-green text-sm font-black text-white">
            FM
          </span>
          <span className="font-serif text-lg font-bold tracking-tight">
            Footymedia
          </span>
        </Link>
        <div className="flex flex-1 items-center gap-3 justify-end">
          <form action="/" method="get" className="hidden sm:block flex-1 max-w-xs">
            <input
              type="search"
              name="q"
              placeholder="Search news…"
              className="w-full rounded-full border border-neutral-300 dark:border-neutral-700 bg-transparent px-4 py-1.5 text-sm outline-none focus:border-afh-green"
            />
          </form>
          <Link
            href="/contact"
            className="text-sm font-semibold text-neutral-600 hover:text-afh-green dark:text-neutral-300"
          >
            Contact
          </Link>
          <DarkModeToggle />
        </div>
      </div>
      <form action="/" method="get" className="mx-auto max-w-5xl px-4 pb-3 sm:hidden">
        <input
          type="search"
          name="q"
          placeholder="Search news…"
          className="w-full rounded-full border border-neutral-300 dark:border-neutral-700 bg-transparent px-4 py-1.5 text-sm outline-none focus:border-afh-green"
        />
      </form>
      <nav className="mx-auto flex max-w-5xl gap-5 overflow-x-auto px-4 pb-3 text-sm font-semibold">
        <Link
          href="/"
          className="whitespace-nowrap text-neutral-600 hover:text-afh-green dark:text-neutral-300"
        >
          All
        </Link>
        {CATEGORIES.map((cat) => (
          <Link
            key={cat}
            href={`/?category=${encodeURIComponent(cat)}`}
            className="whitespace-nowrap text-neutral-600 hover:text-afh-green dark:text-neutral-300"
          >
            {cat}
          </Link>
        ))}
      </nav>
    </header>
  );
}
