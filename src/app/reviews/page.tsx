import type { Metadata } from "next";
import Link from "next/link";
import { PostList } from "@/components/PostList";
import { getPostsByKind } from "@/lib/posts";

export const metadata: Metadata = {
  title: "Reviews",
  description:
    "Places I ate and things I used, scored out of five on the parts that mattered.",
  // An empty index is not a page worth indexing; it lists itself once a review is published.
  ...(getPostsByKind("review").length ? {} : { robots: { index: false } }),
};

export default function ReviewsIndex() {
  return (
    <>
      <h1 className="mb-2 text-3xl font-bold tracking-tight">Reviews</h1>
      <p className="mb-8 text-muted">
        Places I ate and things I used, scored out of five on the parts that
        mattered. Everything else is on the{" "}
        <Link href="/blog" className="text-accent hover:underline">
          blog
        </Link>
        .
      </p>
      <PostList posts={getPostsByKind("review")} />
    </>
  );
}
