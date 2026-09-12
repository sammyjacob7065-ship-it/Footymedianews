export default function AffiliateButton({
  label = "Learn more",
  href = "#",
}: {
  label?: string;
  href?: string;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer sponsored"
      className="inline-flex items-center gap-2 rounded-md bg-afh-green px-4 py-2 text-sm font-bold text-white hover:opacity-90"
    >
      {label} →
    </a>
  );
}
