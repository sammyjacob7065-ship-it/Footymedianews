import type { MetadataRoute } from "next";
import { getAllPosts } from "@/lib/posts";

import { SITE_URL } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const posts = getAllPosts().map((post) => ({
    url: `${SITE_URL}/posts/${post.slug}`,
    lastModified: post.date,
  }));

  return [{ url: SITE_URL, lastModified: new Date().toISOString() }, ...posts];
}
