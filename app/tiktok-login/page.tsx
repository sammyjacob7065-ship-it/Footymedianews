export default function TikTokLoginPage() {
  return (
    <div className="mx-auto max-w-md px-4 py-16 text-center">
      <h1 className="font-serif text-2xl font-black">Connect TikTok</h1>
      <p className="mt-2 text-sm text-neutral-500">
        Authorize this app to post videos to your TikTok account.
      </p>
      <a
        href="/api/tiktok/login"
        className="mt-6 inline-block rounded-md bg-black px-6 py-3 text-sm font-bold text-white hover:opacity-90"
      >
        Continue with TikTok
      </a>
    </div>
  );
}
