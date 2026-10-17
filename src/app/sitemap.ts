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
  // /reviews is in the sitemap once there is a review on it, dated by the newest.
  const [newestReview] = getPostsByKind("review");
  return [
    { url: site.url, lastModified: indexChanged },
    { url: `${site.url}/blog`, lastModified: indexChanged },
    ...(newestReview
      ? [
          {
            url: `${site.url}/reviews`,
            lastModified: new Date(newestReview.updated ?? newestReview.date),
          },
        ]
      : []),
    { url: `${site.url}/about` },
    { url: `${site.url}/colophon` },
    { url: `${site.url}/tags` },
    ...posts,
  ];
}
