import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PostList } from "@/components/PostList";
import { getAllTags, getPostsByTag } from "@/lib/posts";

export const dynamicParams = false;

export function generateStaticParams() {
  return getAllTags().map(({ tag }) => ({ tag }));
}

export async function generateMetadata(props: PageProps<"/tags/[tag]">): Promise<Metadata> {
  const { tag } = await props.params;
  return { title: `#${decodeURIComponent(tag)}`, description: `Posts tagged ${decodeURIComponent(tag)}.` };
}

export default async function TagPage(props: PageProps<"/tags/[tag]">) {
  const tag = decodeURIComponent((await props.params).tag);
  const posts = getPostsByTag(tag);
  if (posts.length === 0) notFound();
  return (
    <>
      <h1 className="mb-8 text-3xl font-bold tracking-tight">#{tag}</h1>
      <PostList posts={posts} />
    </>
  );
}
