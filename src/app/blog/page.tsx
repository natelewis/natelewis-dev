import type { Metadata } from "next";
import { PostList } from "@/components/PostList";
import { getAllPosts } from "@/lib/posts";

export const metadata: Metadata = {
  title: "Blog",
  description: "All posts.",
};

export default function BlogIndex() {
  return (
    <>
      <h1 className="mb-8 text-3xl font-bold tracking-tight">Blog</h1>
      <PostList posts={getAllPosts()} />
    </>
  );
}
