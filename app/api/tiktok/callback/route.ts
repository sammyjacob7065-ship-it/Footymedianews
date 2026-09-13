import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code");
  const state = req.nextUrl.searchParams.get("state");
  const savedState = req.cookies.get("tiktok_oauth_state")?.value;
  const error = req.nextUrl.searchParams.get("error");

  if (error) {
    return htmlResponse(`<p>TikTok returned an error: ${error}</p>`);
  }

  if (!code || !state || state !== savedState) {
    return htmlResponse(
      "<p>Couldn't verify this login attempt (missing or mismatched state). Please try again from /tiktok-login.</p>"
    );
  }

  const clientKey = process.env.TIKTOK_CLIENT_KEY;
  const clientSecret = process.env.TIKTOK_CLIENT_SECRET;
  const redirectUri = process.env.TIKTOK_REDIRECT_URI;

  const tokenRes = await fetch("https://open.tiktokapis.com/v2/oauth/token/", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      "Cache-Control": "no-cache",
    },
    body: new URLSearchParams({
      client_key: clientKey!,
      client_secret: clientSecret!,
      code,
      grant_type: "authorization_code",
      redirect_uri: redirectUri!,
    }),
  });

  const data = await tokenRes.json();

  if (!tokenRes.ok || !data.access_token) {
    return htmlResponse(
      `<p>Token exchange failed:</p><pre>${JSON.stringify(data, null, 2)}</pre>`
    );
  }

  return htmlResponse(`
    <p><strong>Connected successfully.</strong> Copy these into Vercel's Environment Variables now — this page won't show them again.</p>
    <p><strong>TIKTOK_ACCESS_TOKEN</strong></p>
    <pre>${data.access_token}</pre>
    <p><strong>TIKTOK_REFRESH_TOKEN</strong></p>
    <pre>${data.refresh_token}</pre>
    <p style="color:#888">Access token expires in ${Math.round(
      (data.expires_in ?? 0) / 3600
    )} hours. The refresh token is used to get a new one after that.</p>
  `);
}

function htmlResponse(bodyHtml: string) {
  return new NextResponse(
    `<!DOCTYPE html><html><body style="font-family: sans-serif; max-width: 600px; margin: 40px auto; line-height:1.6;">${bodyHtml}</body></html>`,
    { headers: { "Content-Type": "text/html" } }
  );
}
