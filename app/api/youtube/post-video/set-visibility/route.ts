import { NextRequest, NextResponse } from "next/server";

export const maxDuration = 60;

async function getFreshAccessToken() {
  const clientId = process.env.YOUTUBE_CLIENT_ID?.trim();
  const clientSecret = process.env.YOUTUBE_CLIENT_SECRET?.trim();
  const refreshToken = process.env.YOUTUBE_REFRESH_TOKEN?.trim();

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId!,
      client_secret: clientSecret!,
      refresh_token: refreshToken!,
      grant_type: "refresh_token",
    }),
  });

  const data = await res.json();
  if (!res.ok || !data.access_token) {
    throw new Error(`Couldn't refresh access token: ${JSON.stringify(data)}`);
  }
  return data.access_token as string;
}

export async function POST(req: NextRequest) {
  const token = req.headers.get("x-api-token");
  if (!token || token !== process.env.CREATE_POST_TOKEN) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { video_id, privacy } = body ?? {};

  if (!video_id || !["public", "private", "unlisted"].includes(privacy)) {
    return NextResponse.json(
      { error: "video_id and a valid privacy ('public' | 'private' | 'unlisted') are required" },
      { status: 400 }
    );
  }

  let accessToken: string;
  try {
    accessToken = await getFreshAccessToken();
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Token refresh failed" },
      { status: 502 }
    );
  }

  const updateRes = await fetch(
    "https://www.googleapis.com/youtube/v3/videos?part=status",
    {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ id: video_id, status: { privacyStatus: privacy } }),
    }
  );

  const updateData = await updateRes.json();
  if (!updateRes.ok) {
    return NextResponse.json(
      { error: "YouTube rejected the visibility update", details: updateData },
      { status: 502 }
    );
  }

  return NextResponse.json({ success: true, video_id, privacy });
}
