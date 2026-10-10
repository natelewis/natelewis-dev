import type { MetadataRoute } from "next";
import { getAllPosts, getPostsByKind } from "@/lib/posts";
import { site } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const posts = getAllPosts().map((p) => ({
    url: `${site.url}/blog/${p.slug}`,
    lastModified: new Date(p.date),
  }));
  return [
    { url: site.url, lastModified: new Date() },
    { url: `${site.url}/blog`, lastModified: new Date() },
    ...(getPostsByKind("note").length ? [{ url: `${site.url}/notes`, lastModified: new Date() }] : []),
    { url: `${site.url}/about` },
    { url: `${site.url}/colophon` },
    { url: `${site.url}/tags` },
    ...posts,
  ];
}
