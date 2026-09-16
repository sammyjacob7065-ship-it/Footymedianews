import { NextRequest, NextResponse } from "next/server";

/**
 * POST /api/tiktok/post-video
 * Body: { video_url }
 *
 * Uses TikTok's Content Posting API (inbox/video, PULL_FROM_URL method) to
 * send a video — already hosted on this verified domain — to the
 * connected TikTok account's inbox as a draft.
 */

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

  const tiktokRes = await fetch(
    "https://open.tiktokapis.com/v2/post/publish/inbox/video/init/",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        source_info: {
          source: "PULL_FROM_URL",
          video_url,
        },
      }),
    }
  );

  const data = await tiktokRes.json();

  if (!tiktokRes.ok || data.error?.code !== "ok") {
    return NextResponse.json(
      { error: "TikTok rejected the request", details: data },
      { status: 502 }
    );
  }

  return NextResponse.json({
    success: true,
    publish_id: data.data?.publish_id,
  });
}
