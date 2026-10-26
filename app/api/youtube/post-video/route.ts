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

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

// Posts a top-level comment on a video, as the channel owner.
// YouTube's API cannot pin a comment, so the pin is done by hand in YouTube Studio.
export async function POST(req: NextRequest) {
  const token = req.headers.get("x-api-token");
  if (!token || token !== process.env.CREATE_POST_TOKEN) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { video_id, text, channel } = body || {};
  const targetChannel = channel || "football";

  if (!video_id || !text) {
    return NextResponse.json(
      { error: "video_id and text are required" },
      { status: 400 }
    );
  }
  const clean = String(text).trim().slice(0, 9000);

  let accessToken: string;
  try {
    accessToken = await getFreshAccessToken(targetChannel);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Token refresh failed" },
      { status: 502 }
    );
  }

  // A brand-new video can take a few seconds before YouTube accepts comments on it, so try a few times.
  let lastStatus = 0;
  let lastData: unknown = null;
  for (let attempt = 1; attempt <= 4; attempt++) {
    const res = await fetch(
      "https://www.googleapis.com/youtube/v3/commentThreads?part=snippet",
      {
        method: "POST",
        headers: {
          Authorization: "Bearer " + accessToken,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          snippet: {
            videoId: video_id,
            topLevelComment: { snippet: { textOriginal: clean } },
          },
        }),
      }
    );
    lastStatus = res.status;
    const raw = await res.text();
    try {
      lastData = JSON.parse(raw);
    } catch {
      lastData = raw.slice(0, 300);
    }

    if (res.ok) {
      const d = lastData as {
        id?: string;
        snippet?: { topLevelComment?: { id?: string } };
      };
      return NextResponse.json({
        success: true,
        channel: targetChannel,
        video_id,
        thread_id: d.id,
        comment_id: d.snippet?.topLevelComment?.id,
      });
    }
    if (res.status === 401 || res.status === 403) break; // permission problem: retrying will not help
    await sleep(4000);
  }

  const hint =
    lastStatus === 403 || lastStatus === 401
      ? "YouTube refused. The saved login probably does not have the comment permission (scope https://www.googleapis.com/auth/youtube.force-ssl). Add that scope in /youtube-login, connect the channel again, and replace the refresh token in Vercel."
      : undefined;
  return NextResponse.json(
    { error: "YouTube rejected the comment", status: lastStatus, details: lastData, hint },
    { status: 502 }
  );
}
