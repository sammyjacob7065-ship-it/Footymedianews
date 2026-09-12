import fs from "fs";
import path from "path";
import matter from "gray-matter";

const POSTS_DIR = path.join(process.cwd(), "content", "posts");

export type PostFrontmatter = {
  title: string;
  date: string;
  excerpt: string;
  image: string;
  category: string;
  tags?: string[];
};

export type PostSummary = PostFrontmatter & { slug: string };

export function getAllSlugs(): string[] {
  if (!fs.existsSync(POSTS_DIR)) return [];
  return fs
    .readdirSync(POSTS_DIR)
    .filter((f) => f.endsWith(".mdx"))
    .map((f) => f.replace(/\.mdx$/, ""));
}

export function getAllPosts(): PostSummary[] {
  return getAllSlugs()
    .map((slug) => {
      const raw = fs.readFileSync(path.join(POSTS_DIR, `${slug}.mdx`), "utf8");
      const { data } = matter(raw);
      return { slug, ...(data as PostFrontmatter) };
    })
    .sort((a, b) => (a.date < b.date ? 1 : -1));
}

export function getPostsByCategory(category: string): PostSummary[] {
  return getAllPosts().filter(
    (p) => p.category.toLowerCase() === category.toLowerCase()
  );
}

export function searchPosts(query: string): PostSummary[] {
  const q = query.trim().toLowerCase();
  if (!q) return getAllPosts();
  return getAllPosts().filter(
    (p) =>
      p.title.toLowerCase().includes(q) ||
      p.excerpt.toLowerCase().includes(q) ||
      p.category.toLowerCase().includes(q) ||
      (p.tags ?? []).some((t) => t.toLowerCase().includes(q))
  );
}

export function getPostBySlug(slug: string) {
  const filePath = path.join(POSTS_DIR, `${slug}.mdx`);
  if (!fs.existsSync(filePath)) return null;
  const raw = fs.readFileSync(filePath, "utf8");
  const { data, content } = matter(raw);
  return { frontmatter: data as PostFrontmatter, content, slug };
}
