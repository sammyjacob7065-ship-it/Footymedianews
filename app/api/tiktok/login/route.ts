import { NextRequest, NextResponse } from "next/server";

// Never cache this route — it must generate a fresh state and read the
// latest env vars on every single request, not a cached/stale response.
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(req: NextRequest) {
  const clientKey = process.env.TIKTOK_CLIENT_KEY?.trim();
  const redirectUri = process.env.TIKTOK_REDIRECT_URI?.trim();

  if (!clientKey || !redirectUri) {
    return NextResponse.json(
      { error: "TikTok login isn't configured yet (missing env vars)." },
      { status: 500 }
    );
  }

  const state = Math.random().toString(36).substring(2);

  const authUrl = new URL("https://www.tiktok.com/v2/auth/authorize/");
  authUrl.searchParams.set("client_key", clientKey);
  authUrl.searchParams.set("scope", "video.upload");
  authUrl.searchParams.set("response_type", "code");
  authUrl.searchParams.set("redirect_uri", redirectUri);
  authUrl.searchParams.set("state", state);

  const res = NextResponse.redirect(authUrl.toString());
  res.headers.set("Cache-Control", "no-store, max-age=0");
  return res;
}
