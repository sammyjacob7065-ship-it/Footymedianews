import { NextRequest, NextResponse } from "next/server";

/**
 * POST /api/youtube/post-video
 * Body: { video_url, title, description }
 *
 * Uploads a video to the connected YouTube channel. Google access tokens
 * expire after about an hour, so this always exchanges the long-lived
 * refresh token for a brand-new access token first, rather than relying
 * on a possibly-stale YOUTUBE_ACCESS_TOKEN.
 */

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

  const rawText = await res.text();
  let data;
  try {
    data = JSON.parse(rawText);
  } catch {
    throw new Error(
      `Google's token endpoint returned something unexpected (status ${res.status}): ${rawText.slice(0, 300)}`
    );
  }

  if (!res.ok || !data.access_token) {
    throw new Error(
      `Couldn't refresh access token: ${JSON.stringify(data)}`
    );
  }
  return data.access_token as string;
}

export async function POST(req: NextRequest) {
  const token = req.headers.get("x-api-token");
  if (!token || token !== process.env.CREATE_POST_TOKEN) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { video_url, title, description } = body ?? {};

  if (!video_url || !title) {
    return NextResponse.json(
      { error: "video_url and title are required" },
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

  // 1. Fetch the video bytes from Blob storage.
  const videoRes = await fetch(video_url);
  if (!videoRes.ok) {
    return NextResponse.json(
      { error: "Couldn't fetch the uploaded video from storage" },
      { status: 502 }
    );
  }
  const videoBuffer = await videoRes.arrayBuffer();

  // 2. Start a resumable upload session with YouTube.
  const metadata = {
    snippet: {
      title,
      description: description ?? "",
    },
    status: {
      privacyStatus: "public",
    },
  };

  const initRes = await fetch(
    "https://www.googleapis.com/upload/youtube/v3/videos?uploadType=resumable&part=snippet,status",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
        "X-Upload-Content-Type": "video/mp4",
      },
      body: JSON.stringify(metadata),
    }
  );

  if (!initRes.ok) {
    const errText = await initRes.text();
    return NextResponse.json(
      { error: "YouTube rejected the upload init request", details: errText },
      { status: 502 }
    );
  }

  const uploadUrl = initRes.headers.get("location");
  if (!uploadUrl) {
    return NextResponse.json(
      { error: "YouTube didn't return an upload URL" },
      { status: 502 }
    );
  }

  // 3. Send the actual video bytes.
  const uploadRes = await fetch(uploadUrl, {
    method: "PUT",
    headers: { "Content-Type": "video/mp4" },
    body: videoBuffer,
  });

  const uploadData = await uploadRes.json();

  if (!uploadRes.ok) {
    return NextResponse.json(
      { error: "YouTube rejected the video upload", details: uploadData },
      { status: 502 }
    );
  }

  return NextResponse.json({
    success: true,
    video_id: uploadData.id,
    video_url: `https://youtube.com/watch?v=${uploadData.id}`,
  });
}
