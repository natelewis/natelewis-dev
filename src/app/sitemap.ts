import type { MetadataRoute } from "next";
import { getAllPosts, getPostsByKind } from "@/lib/posts";
import { site } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  // The index pages change when a post does, not on every build.
  const newest = getAllPosts()[0];
  const indexChanged = newest
    ? new Date(newest.updated ?? newest.date)
    : undefined;
  const posts = getAllPosts().map((p) => ({
    url: `${site.url}/blog/${p.slug}`,
    lastModified: new Date(p.date),
  }));
  return [
    { url: site.url, lastModified: indexChanged },
    { url: `${site.url}/blog`, lastModified: indexChanged },
    ...(getPostsByKind("note").length
      ? [
          {
            url: `${site.url}/notes`,
            lastModified: new Date(
              getPostsByKind("note")[0].updated ??
                getPostsByKind("note")[0].date,
            ),
          },
        ]
      : []),
    { url: `${site.url}/about` },
    { url: `${site.url}/colophon` },
    { url: `${site.url}/tags` },
    ...posts,
  ];
}
