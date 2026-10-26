import { NextRequest, NextResponse } from "next/server";

export const maxDuration = 60;

function envSuffix(channel: string) {
  return channel
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

async function getFreshAccessToken(channel: string) {
  const clientId = process.env.YOUTUBE_CLIENT_ID?.trim();
  const clientSecret = process.env.YOUTUBE_CLIENT_SECRET?.trim();

  const suffix = envSuffix(channel);
  const channelSpecificVar = "YOUTUBE_" + suffix + "_REFRESH_TOKEN";
  const refreshToken =
    process.env[channelSpecificVar]?.trim() ||
    process.env.YOUTUBE_REFRESH_TOKEN?.trim();

  if (!refreshToken) {
    throw new Error(
      "No refresh token found for channel '" +
        channel +
        "'. Expected env var " +
        channelSpecificVar +
        " (or YOUTUBE_REFRESH_TOKEN as fallback). Connect this channel first at /youtube-login."
    );
  }

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId || "",
      client_secret: clientSecret || "",
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
  });

  const rawText = await res.text();
  let data;
  try {
    data = JSON.parse(rawText);
  } catch {
    throw new Error(
      "Google's token endpoint returned something unexpected (status " +
        res.status +
        "): " +
        rawText.slice(0, 300)
    );
  }

  if (!res.ok || !data.access_token) {
    throw new Error("Couldn't refresh access token: " + JSON.stringify(data));
  }
  return data.access_token as string;
}

export async function POST(req: NextRequest) {
  const token = req.headers.get("x-api-token");
  if (!token || token !== process.env.CREATE_POST_TOKEN) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { video_url, title, description, channel } = body || {};
  const targetChannel = channel || "football";

  if (!video_url || !title) {
    return NextResponse.json(
      { error: "video_url and title are required" },
      { status: 400 }
    );
  }

  let accessToken: string;
  try {
    accessToken = await getFreshAccessToken(targetChannel);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Token refresh failed" },
      { status: 502 }
    );
  }

  const videoRes = await fetch(video_url);
  if (!videoRes.ok) {
    return NextResponse.json(
      { error: "Couldn't fetch the uploaded video from storage" },
      { status: 502 }
    );
  }
  const videoBuffer = await videoRes.arrayBuffer();

  const metadata = {
    snippet: { title: title, description: description || "" },
    status: { privacyStatus: "public" },
  };

  const initRes = await fetch(
    "https://www.googleapis.com/upload/youtube/v3/videos?uploadType=resumable&part=snippet,status",
    {
      method: "POST",
      headers: {
        Authorization: "Bearer " + accessToken,
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
    channel: targetChannel,
    video_id: uploadData.id,
    video_url: "https://youtube.com/watch?v=" + uploadData.id,
  });
}
