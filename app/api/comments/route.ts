import { NextRequest, NextResponse } from "next/server";
import { addComment, commentsConfigured } from "@/lib/comments";

export async function POST(req: NextRequest) {
  if (!commentsConfigured()) {
    return NextResponse.json(
      { error: "Comments aren't set up yet" },
      { status: 503 }
    );
  }

  const body = await req.json();
  const { slug, name, comment, website } = body ?? {};

  // honeypot — real visitors never fill this hidden field, bots often do
  if (website) {
    return NextResponse.json({ success: true });
  }

  if (!slug || !name || !comment) {
    return NextResponse.json(
      { error: "slug, name and comment are required" },
      { status: 400 }
    );
  }

  if (name.length > 60 || comment.length > 1000) {
    return NextResponse.json(
      { error: "Name or comment is too long" },
      { status: 400 }
    );
  }

  const ok = await addComment(slug, name.trim(), comment.trim());
  if (!ok) {
    return NextResponse.json(
      { error: "Could not save comment" },
      { status: 502 }
    );
  }

  return NextResponse.json({ success: true });
}
