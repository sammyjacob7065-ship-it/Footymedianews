import { NextRequest, NextResponse } from "next/server";

// If you turn on Fluid Compute in Vercel you can raise both numbers (for example 300 and 300000).
export const maxDuration = 60;
const TIME_BUDGET_MS = 60000;

// ---- Custom thumbnail (optional). It runs only AFTER the video is already posted, and it can never make the post fail. ----
const THUMB_MAX_BYTES = 2 * 1024 * 1024; // YouTube's limit for a custom thumbnail

type ThumbPrep =
  | { ok: true; buffer: ArrayBuffer; contentType: string }
  | { ok: false; reason: string };

// Downloads the cover image and checks it. Never throws.
async function prepareThumbnail(url: string): Promise<ThumbPrep> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 15000);
  try {
    const res = await fetch(url, { signal: ctrl.signal });
    if (!res.ok) {
      return { ok: false, reason: "could not download the cover (HTTP " + res.status + ")" };
    }
    const buffer = await res.arrayBuffer();
    if (buffer.byteLength > THUMB_MAX_BYTES) {
      return { ok: false, reason: "cover is over YouTube's 2 MB limit" };
    }
    const b = new Uint8Array(buffer.slice(0, 4));
    let contentType = "";
    if (b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) contentType = "image/jpeg";
    else if (b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47) contentType = "image/png";
    if (!contentType) return { ok: false, reason: "cover is not a JPEG or PNG image" };
    return { ok: true, buffer, contentType };
  } catch (err) {
    return { ok: false, reason: "could not download the cover (" + (err instanceof Error ? err.message : "error") + ")" };
  } finally {
    clearTimeout(timer);
  }
}

// Sets the thumbnail on the video. Never throws. Returns "set" or a short reason.
async function setThumbnail(
  accessToken: string,
  videoId: string,
  thumb: { buffer: ArrayBuffer; contentType: string },
  deadline: number
): Promise<string> {
  let last = "no attempt made";
  for (let attempt = 1; attempt <= 3; attempt++) {
    const left = deadline - Date.now();
    if (left < 3000) return "skipped: ran out of time (" + last + ")";
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), Math.min(10000, left));
    try {
      const res = await fetch(
        "https://www.googleapis.com/upload/youtube/v3/thumbnails/set?uploadType=media&videoId=" +
          encodeURIComponent(videoId),
        {
          method: "POST",
          headers: { Authorization: "Bearer " + accessToken, "Content-Type": thumb.contentType },
          body: thumb.buffer,
          signal: ctrl.signal,
        }
      );
      const text = await res.text();
      if (res.ok) return "set";
      let msg = text.slice(0, 140);
      try {
        const j = JSON.parse(text);
        if (j && j.error && j.error.message) msg = String(j.error.message);
      } catch {}
      last = "HTTP " + res.status + " " + msg;
      // only temporary problems are worth retrying
      if (![404, 429, 500, 502, 503, 504].includes(res.status)) return "failed: " + last;
    } catch (err) {
      last = err instanceof Error ? err.message : "network error";
    } finally {
      clearTimeout(timer);
    }
    await new Promise((r) => setTimeout(r, 2500));
  }
  return "failed: " + last;
}

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
  const startedAt = Date.now();
  const token = req.headers.get("x-api-token");
  if (!token || token !== process.env.CREATE_POST_TOKEN) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { video_url, title, description, channel, thumbnail_url } = body || {};
  const targetChannel = channel || "football";

  if (!video_url || !title) {
    return NextResponse.json(
      { error: "video_url and title are required" },
      { status: 400 }
    );
  }

  // start downloading the cover now, in parallel; it is only used after the video is posted
  const thumbPrep: Promise<ThumbPrep> | null = thumbnail_url ? prepareThumbnail(String(thumbnail_url)) : null;

  let accessToken: string;
  try {
    accessToken = await getFreshAccessToken(targetChannel);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Token refresh failed" },
      { status: 502 }
    );
  }

  // v76: the film is STREAMED from storage straight into YouTube. It is never held in memory, so a long full-quality film does not run out of memory or time.
  let videoRes: Response;
  try {
    videoRes = await fetch(video_url, { redirect: "follow" });
  } catch (err) {
    return NextResponse.json(
      { error: "Couldn't reach the video link: " + (err instanceof Error ? err.message : String(err)) },
      { status: 502 }
    );
  }
  if (!videoRes.ok || !videoRes.body) {
    return NextResponse.json(
      { error: "Couldn't fetch the uploaded video from storage (HTTP " + videoRes.status + ")" },
      { status: 502 }
    );
  }
  const videoLength = videoRes.headers.get("content-length");

  const metadata = {
    snippet: { title: title, description: description || "" },
    status: { privacyStatus: "public" },
  };

  const initHeaders: Record<string, string> = {
    Authorization: "Bearer " + accessToken,
    "Content-Type": "application/json",
    "X-Upload-Content-Type": "video/mp4",
  };
  if (videoLength) initHeaders["X-Upload-Content-Length"] = videoLength;

  const initRes = await fetch(
    "https://www.googleapis.com/upload/youtube/v3/videos?uploadType=resumable&part=snippet,status",
    {
      method: "POST",
      headers: initHeaders,
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

  let uploadRes: Response;
  try {
    if (videoLength) {
      const putInit = {
        method: "PUT",
        headers: { "Content-Type": "video/mp4", "Content-Length": videoLength },
        body: videoRes.body,
        duplex: "half",
      } as RequestInit & { duplex: "half" };
      uploadRes = await fetch(uploadUrl, putInit);
    } else {
      // the storage did not say how big the film is: fall back to holding it in memory
      const buf = await videoRes.arrayBuffer();
      uploadRes = await fetch(uploadUrl, { method: "PUT", headers: { "Content-Type": "video/mp4" }, body: buf });
    }
  } catch (err) {
    return NextResponse.json(
      { error: "The upload to YouTube was cut off: " + (err instanceof Error ? err.message : String(err)) },
      { status: 502 }
    );
  }

  const uploadText = await uploadRes.text();
  let uploadData: { id?: string } = {};
  try {
    uploadData = JSON.parse(uploadText);
  } catch {
    // not JSON: handled below
  }

  if (!uploadRes.ok || !uploadData.id) {
    return NextResponse.json(
      { error: "YouTube rejected the video upload (HTTP " + uploadRes.status + ")", details: uploadText.slice(0, 600) },
      { status: 502 }
    );
  }

  // The video is already live at this point. The thumbnail step below can only add information, never remove the success.
  let thumbnailStatus: string | undefined;
  if (thumbPrep) {
    try {
      const prep = await thumbPrep;
      if (!prep.ok) thumbnailStatus = "skipped: " + prep.reason;
      else thumbnailStatus = await setThumbnail(accessToken, uploadData.id, prep, startedAt + TIME_BUDGET_MS - 8000);
    } catch (err) {
      thumbnailStatus = "failed: " + (err instanceof Error ? err.message : "unknown error");
    }
  }

  return NextResponse.json({
    success: true,
    channel: targetChannel,
    video_id: uploadData.id,
    video_url: "https://youtube.com/watch?v=" + uploadData.id,
    ...(thumbnailStatus ? { thumbnail: thumbnailStatus.slice(0, 160) } : {}),
  });
}
