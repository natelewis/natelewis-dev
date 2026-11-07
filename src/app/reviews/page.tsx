import type { Metadata } from "next";
import Link from "next/link";
import { PostList } from "@/components/PostList";
import { getPostsByKind } from "@/lib/posts";
import { site } from "@/lib/site";
import { JsonLd, person } from "@/components/JsonLd";

const description =
  "Places I ate and things I used, scored out of five on the parts that mattered.";

export const metadata: Metadata = {
  title: "Reviews",
  description,
  // An empty index is not a page worth indexing; it lists itself once a review is published.
  ...(getPostsByKind("review").length ? {} : { robots: { index: false } }),
};

export default function ReviewsIndex() {
  const reviews = getPostsByKind("review");
  return (
    <>
      <JsonLd
        data={{
          "@type": "CollectionPage",
          name: "Reviews",
          url: `${site.url}/reviews`,
          description,
          isPartOf: { "@type": "WebSite", name: site.title, url: site.url },
          author: person,
          mainEntity: {
            "@type": "ItemList",
            numberOfItems: reviews.length,
            itemListElement: reviews.map((p, i) => ({
              "@type": "ListItem",
              position: i + 1,
              name: p.title,
              url: `${site.url}/blog/${p.slug}`,
            })),
          },
        }}
      />
      <h1 className="mb-2 text-3xl font-bold tracking-tight">Reviews</h1>
      <p className="mb-8 text-muted">
        Places I ate and things I used, scored out of five on the parts that
        mattered. Everything else is on the{" "}
        <Link href="/blog" className="text-accent hover:underline">
          blog
        </Link>
        .
      </p>
      <PostList posts={reviews} />
    </>
  );
}
