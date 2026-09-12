export default function Hero() {
  return (
    <section className="border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/40">
      <div className="mx-auto max-w-5xl px-4 py-10">
        <p className="mb-2 text-xs font-bold uppercase tracking-widest text-afh-green">
          Breaking News
        </p>
        <h1 className="font-serif text-3xl font-black tracking-tight sm:text-4xl">
          Latest Football News
        </h1>
        <p className="mt-2 max-w-xl text-neutral-600 dark:text-neutral-400">
          Premier League, Champions League, La Liga, Europa League and Serie A —
          scores, transfers and match previews, updated as they happen.
        </p>
      </div>
    </section>
  );
}
