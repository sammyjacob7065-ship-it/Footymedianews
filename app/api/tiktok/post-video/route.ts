import { NextRequest, NextResponse } from "next/server";

/**
 * POST /api/tiktok/post-video
 * Body: { video_url }  (a Vercel Blob URL where the video already lives)
 *
 * Uses TikTok's Content Posting API with source=FILE_UPLOAD instead of
 * PULL_FROM_URL. PULL_FROM_URL requires TikTok to fetch from a domain
 * you've verified with them — Vercel Blob's storage domain can't be
 * verified that way, so FILE_UPLOAD (sending the bytes directly) is the
 * correct method here. This route fetches the video from Blob storage
 * server-side, then forwards those bytes to TikTok.
 */

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  const token = req.headers.get("x-api-token");
  if (!token || token !== process.env.CREATE_POST_TOKEN) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { video_url } = body ?? {};

  if (!video_url) {
    return NextResponse.json(
      { error: "video_url is required" },
      { status: 400 }
    );
  }

  const accessToken = process.env.TIKTOK_ACCESS_TOKEN?.trim();
  if (!accessToken) {
    return NextResponse.json(
      { error: "TIKTOK_ACCESS_TOKEN isn't set yet" },
      { status: 500 }
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
  const videoSize = videoBuffer.byteLength;

  // 2. Tell TikTok we're about to send a file (single chunk — fine for
  // short clips under TikTok's per-chunk limits).
  const initRes = await fetch(
    "https://open.tiktokapis.com/v2/post/publish/inbox/video/init/",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        source_info: {
          source: "FILE_UPLOAD",
          video_size: videoSize,
          chunk_size: videoSize,
          total_chunk_count: 1,
        },
      }),
    }
  );

  const initData = await initRes.json();

  if (!initRes.ok || initData.error?.code !== "ok") {
    return NextResponse.json(
      { error: "TikTok rejected the upload init request", details: initData },
      { status: 502 }
    );
  }

  const uploadUrl = initData.data?.upload_url;
  const publishId = initData.data?.publish_id;

  // 3. Send the actual video bytes to the URL TikTok just gave us.
  const uploadRes = await fetch(uploadUrl, {
    method: "PUT",
    headers: {
      "Content-Type": "video/mp4",
      "Content-Range": `bytes 0-${videoSize - 1}/${videoSize}`,
    },
    body: videoBuffer,
  });

  if (!uploadRes.ok) {
    const errText = await uploadRes.text();
    return NextResponse.json(
      { error: "TikTok rejected the video upload", details: errText },
      { status: 502 }
    );
  }

  return NextResponse.json({ success: true, publish_id: publishId });
}
