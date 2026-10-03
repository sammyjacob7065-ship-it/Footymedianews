import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code");
  const error = req.nextUrl.searchParams.get("error");

  if (error) {
    return htmlResponse(`<p>Google returned an error: ${error}</p>`);
  }

  if (!code) {
    return htmlResponse(
      "<p>No authorization code received. Please try again from /youtube-login.</p>"
    );
  }

  const clientId = process.env.YOUTUBE_CLIENT_ID?.trim();
  const clientSecret = process.env.YOUTUBE_CLIENT_SECRET?.trim();
  const redirectUri = process.env.YOUTUBE_REDIRECT_URI?.trim();

  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId!,
      client_secret: clientSecret!,
      code,
      grant_type: "authorization_code",
      redirect_uri: redirectUri!,
    }),
  });

  const data = await tokenRes.json();

  if (!tokenRes.ok || !data.access_token) {
    const maskedId = clientId
      ? `${clientId.slice(0, 6)}...${clientId.slice(-6)}`
      : "MISSING";
    return htmlResponse(
      `<p>Token exchange failed:</p><pre>${JSON.stringify(data, null, 2)}</pre>
       <p style="color:#888">Debug — client id used: ${maskedId}, redirect_uri used: ${redirectUri}</p>`
    );
  }

  return htmlResponse(`
    <p><strong>Connected successfully.</strong> Copy these into Vercel's Environment Variables now — this page won't show them again.</p>
    <p><strong>YOUTUBE_ACCESS_TOKEN</strong></p>
    <pre>${data.access_token}</pre>
    <p><strong>YOUTUBE_REFRESH_TOKEN</strong></p>
    <pre>${data.refresh_token ?? "(not returned — see note below)"}</pre>
    <p style="color:#888">Access token expires in ${Math.round(
      (data.expires_in ?? 0) / 60
    )} minutes. The refresh token is used to get a new one after that — save it, it won't be shown again.
    ${
      !data.refresh_token
        ? "If no refresh token shows here, it's likely because you'd already authorized this app before — go to myaccount.google.com/permissions, remove access for this app, then try /youtube-login again."
        : ""
    }
    </p>
  `);
}

function htmlResponse(bodyHtml: string) {
  return new NextResponse(
    `<!DOCTYPE html><html><body style="font-family: sans-serif; max-width: 600px; margin: 40px auto; line-height:1.6;">${bodyHtml}</body></html>`,
    {
      headers: {
        "Content-Type": "text/html",
        "Cache-Control": "no-store, max-age=0",
      },
    }
  );
}
