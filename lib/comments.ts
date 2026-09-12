const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

export type Comment = {
  id: string;
  post_slug: string;
  name: string;
  body: string;
  created_at: string;
};

export function commentsConfigured(): boolean {
  return Boolean(SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY);
}

export async function getComments(slug: string): Promise<Comment[]> {
  if (!commentsConfigured()) return [];

  try {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/comments?post_slug=eq.${encodeURIComponent(
        slug
      )}&select=id,post_slug,name,body,created_at&order=created_at.asc`,
      {
        headers: {
          apikey: SUPABASE_SERVICE_ROLE_KEY!,
          Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        },
        cache: "no-store",
      }
    );

    if (!res.ok) return [];
    return await res.json();
  } catch {
    // Supabase unreachable at build/render time — fail quietly, don't
    // crash the page or the build.
    return [];
  }
}

export async function addComment(
  slug: string,
  name: string,
  body: string
): Promise<boolean> {
  if (!commentsConfigured()) return false;

  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/comments`, {
      method: "POST",
      headers: {
        apikey: SUPABASE_SERVICE_ROLE_KEY!,
        Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        "Content-Type": "application/json",
        Prefer: "return=minimal",
      },
      body: JSON.stringify({ post_slug: slug, name, body }),
    });

    return res.ok;
  } catch {
    return false;
  }
}
