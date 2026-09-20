import type { Metadata } from "next";
import Link from "next/link";
import { getAllTags } from "@/lib/posts";

export const metadata: Metadata = {
  title: "Tags",
  description: "Posts by topic.",
};

export default function TagsIndex() {
  const tags = getAllTags();
  return (
    <>
      <h1 className="mb-8 text-3xl font-bold tracking-tight">Tags</h1>
      {tags.length === 0 ? (
        <p className="text-muted">Nothing here yet.</p>
      ) : (
        <ul className="flex flex-wrap gap-3">
          {tags.map(({ tag, count }) => (
            <li key={tag}>
              <Link
                href={`/tags/${encodeURIComponent(tag)}`}
                className="rounded-full border border-border px-3 py-1 text-sm hover:border-accent hover:text-accent"
              >
                #{tag} <span className="text-muted">{count}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
