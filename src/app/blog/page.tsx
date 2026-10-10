import type { Metadata } from "next";
import { PostList } from "@/components/PostList";
import { getAllPosts } from "@/lib/posts";
import { site } from "@/lib/site";
import { JsonLd, person } from "@/components/JsonLd";

export const metadata: Metadata = {
  title: "Blog",
  description:
    "Every post by Nate Lewis, newest first: building with AI agents, LLM prompts, CI speed, Next.js and Firebase, measured rather than guessed.",
};

export default function BlogIndex() {
  const posts = getAllPosts();
  return (
    <>
      <JsonLd
        data={{
          "@type": "Blog",
          name: `${site.title} blog`,
          url: `${site.url}/blog`,
          author: person,
          blogPost: posts.map((p) => ({
            "@type": "BlogPosting",
            headline: p.title,
            url: `${site.url}/blog/${p.slug}`,
            datePublished: p.date,
          })),
        }}
      />
      <h1 className="mb-8 text-3xl font-bold tracking-tight">Blog</h1>
      <PostList posts={posts} />
    </>
  );
}
