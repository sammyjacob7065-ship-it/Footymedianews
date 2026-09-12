import { NextRequest, NextResponse } from "next/server";

/**
 * POST /api/upload-image
 * Body: { filename, contentBase64 }
 *
 * Commits the image straight into public/uploads/ in your GitHub repo,
 * reusing the same GITHUB_TOKEN/OWNER/REPO already set up for posts —
 * no separate image-hosting service needed. Once Vercel redeploys, the
 * image is served at /uploads/<filename>.
 */

export async function POST(req: NextRequest) {
  const token = req.headers.get("x-api-token");
  if (!token || token !== process.env.CREATE_POST_TOKEN) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { filename, contentBase64 } = body ?? {};

  if (!filename || !contentBase64) {
    return NextResponse.json(
      { error: "filename and contentBase64 are required" },
      { status: 400 }
    );
  }

  const safeName = `${Date.now()}-${filename
    .toLowerCase()
    .replace(/[^a-z0-9.]+/g, "-")}`;
  const filePath = `public/uploads/${safeName}`;

  const { GITHUB_TOKEN, GITHUB_OWNER, GITHUB_REPO, GITHUB_BRANCH } =
    process.env;

  const ghRes = await fetch(
    `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${filePath}`,
    {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${GITHUB_TOKEN}`,
        Accept: "application/vnd.github+json",
      },
      body: JSON.stringify({
        message: `Upload image: ${safeName}`,
        content: contentBase64,
        branch: GITHUB_BRANCH || "main",
      }),
    }
  );

  if (!ghRes.ok) {
    const errBody = await ghRes.text();
    return NextResponse.json(
      { error: "GitHub upload failed", details: errBody },
      { status: 502 }
    );
  }

  return NextResponse.json({ success: true, url: `/uploads/${safeName}` });
}
