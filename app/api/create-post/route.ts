import { NextRequest, NextResponse } from "next/server";

/**
 * POST /api/create-post
 * Body: { title, content, excerpt, image, category, tags? }
 *
 * Commits a new .mdx file to content/posts/ in your GitHub repo via the
 * GitHub Contents API. This is required — writing to the local filesystem
 * from a Vercel serverless function does NOT persist; the only way a new
 * post can actually appear on the live site is if it's committed to the
 * repo, which then triggers Vercel's normal git-push deploy.
 *
 * NOTE: your n8n "Publish To Website (GitHub)" node already does this
 * exact GitHub-commit step for the Jekyll site. If you'd rather not run
 * a second system, you can skip this route entirely and just repoint
 * that same n8n node at content/posts/*.mdx with this frontmatter shape.
 */

function slugify(title: string) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export async function POST(req: NextRequest) {
  const token = req.headers.get("x-api-token");
  if (!token || token !== process.env.CREATE_POST_TOKEN) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { title, content, excerpt, image, category, tags } = body ?? {};

  if (!title || !content || !excerpt || !image || !category) {
    return NextResponse.json(
      { error: "title, content, excerpt, image and category are required" },
      { status: 400 }
    );
  }

  const date = new Date().toISOString();
  const slug = `${date.slice(0, 10)}-${slugify(title)}`;
  const filePath = `content/posts/${slug}.mdx`;

  const frontmatter = [
    "---",
    `title: ${JSON.stringify(title)}`,
    `date: "${date}"`,
    `excerpt: ${JSON.stringify(excerpt)}`,
    `image: ${JSON.stringify(image)}`,
    `category: ${JSON.stringify(category)}`,
    tags?.length ? `tags: [${tags.map((t: string) => JSON.stringify(t)).join(", ")}]` : null,
    "---",
    "",
  ]
    .filter(Boolean)
    .join("\n");

  const fileContent = frontmatter + content;

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
        message: `Add post: ${title}`,
        content: Buffer.from(fileContent, "utf8").toString("base64"),
        branch: GITHUB_BRANCH || "main",
      }),
    }
  );

  if (!ghRes.ok) {
    const errBody = await ghRes.text();
    return NextResponse.json(
      { error: "GitHub commit failed", details: errBody },
      { status: 502 }
    );
  }

  return NextResponse.json({ success: true, slug, path: filePath });
}
