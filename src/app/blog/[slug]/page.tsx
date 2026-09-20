import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { formatDate, getPost, getPostSlugs } from "@/lib/posts";
import { site } from "@/lib/site";

export const dynamicParams = false;

export function generateStaticParams() {
  return getPostSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata(
  props: PageProps<"/blog/[slug]">,
): Promise<Metadata> {
  const { slug } = await props.params;
  const post = await getPost(slug);
  if (!post) return {};
  return {
    title: post.title,
    description: post.description,
    openGraph: {
      type: "article",
      title: post.title,
      description: post.description,
      url: `${site.url}/blog/${post.slug}`,
      publishedTime: post.date,
      authors: [site.author],
    },
  };
}

export default async function PostPage(props: PageProps<"/blog/[slug]">) {
  const { slug } = await props.params;
  const post = await getPost(slug);
  if (!post) notFound();

  return (
    <article style={{ "--accent": post.accent } as React.CSSProperties}>
      <header className="mb-8 border-l-2 border-accent pl-4">
        <h1 className="text-3xl font-bold tracking-tight">{post.title}</h1>
        <p className="mt-2 text-sm text-muted">
          <time dateTime={post.date}>{formatDate(post.date)}</time> ·{" "}
          {post.readingMinutes} min read
          {post.tags.length > 0 && <> · {post.tags.join(", ")}</>}
        </p>
      </header>
      <div
        className="prose prose-neutral dark:prose-invert max-w-none"
        dangerouslySetInnerHTML={{ __html: post.html }}
      />
    </article>
  );
}
