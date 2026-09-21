import type { Metadata } from "next";
import { PostList } from "@/components/PostList";
import { getPostsByKind } from "@/lib/posts";

export const metadata: Metadata = {
  title: "Notes",
  description: "Short ones: one finding, one number, a few hundred words.",
};

export default function NotesIndex() {
  return (
    <>
      <h1 className="mb-2 text-3xl font-bold tracking-tight">Notes</h1>
      <p className="mb-8 text-muted">
        Short ones. One finding, one number, a few hundred words. The long posts
        are on the{" "}
        <a href="/blog" className="text-accent hover:underline">
          blog
        </a>
        .
      </p>
      <PostList posts={getPostsByKind("note")} />
    </>
  );
}
