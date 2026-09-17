import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("key");
  if (!token || token !== process.env.CREATE_POST_TOKEN) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const publishId = req.nextUrl.searchParams.get("publish_id");
  if (!publishId) {
    return NextResponse.json(
      { error: "publish_id query param is required" },
      { status: 400 }
    );
  }

  const accessToken = process.env.TIKTOK_ACCESS_TOKEN?.trim();

  const res = await fetch(
    "https://open.tiktokapis.com/v2/post/publish/status/fetch/",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ publish_id: publishId }),
    }
  );

  const data = await res.json();
  return NextResponse.json(data);
}
