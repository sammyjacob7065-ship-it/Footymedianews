export default function YoutubeLoginPage() {
  return (
    <div className="mx-auto max-w-md px-4 py-16 text-center">
      <h1 className="font-serif text-2xl font-black">Connect YouTube</h1>
      <p className="mt-2 text-sm text-neutral-500">
        Authorize this app to upload videos to your YouTube channel.
      </p>
      <a
        href="/api/youtube/login"
        className="mt-6 inline-block rounded-md bg-red-600 px-6 py-3 text-sm font-bold text-white hover:opacity-90"
      >
        Continue with Google
      </a>
    </div>
  );
}
