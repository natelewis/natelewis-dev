import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { TagList } from "@/components/TagList";
import { Tldr } from "@/components/Tldr";
import { Toc } from "@/components/Toc";
import { formatDate, getPost, getPostSlugs } from "@/lib/posts";
import { site } from "@/lib/site";
import { topicsForTags } from "@/lib/topics";

export const dynamicParams = false;

// Drafts are built too: a draft is reachable by its URL, just not listed.
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
    // A draft is the one page a crawler is asked to leave alone; it is also
    // absent from the sitemap and RSS, so nothing points a crawler at it.
    robots: post.draft ? { index: false, follow: false } : undefined,
    openGraph: {
      // A nested openGraph replaces the layout's wholesale, so restate the site name.
      siteName: site.title,
      type: "article",
      title: post.title,
      description: post.description,
      url: `${site.url}/blog/${post.slug}`,
      publishedTime: post.date,
      modifiedTime: post.updated ?? undefined,
      authors: [site.author],
      tags: post.tags,
      images: post.images
        ? [{ url: post.images.banner, width: 1600, height: 900 }]
        : [{ url: "/og.png", width: 1200, height: 630 }],
    },
  };
}

export default async function PostPage(props: PageProps<"/blog/[slug]">) {
  const { slug } = await props.params;
  const post = await getPost(slug);
  if (!post) notFound();

  // Structured data for search engines; the TL;DR doubles as the abstract.
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.description,
    abstract: post.tldr.length ? post.tldr.join(" ") : undefined,
    datePublished: post.date,
    dateModified: post.updated ?? post.date,
    author: { "@type": "Person", name: site.author, url: site.url },
    image: post.images ? `${site.url}${post.images.banner}` : undefined,
    keywords: post.tags.join(", "),
    mainEntityOfPage: `${site.url}/blog/${post.slug}`,
  };

  return (
    <article
      data-topics={topicsForTags(post.tags)}
      style={{ "--accent": post.accent } as React.CSSProperties}
    >
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {post.draft && (
        <p className="mb-6 rounded border border-accent/40 bg-accent/10 px-3 py-2 text-sm">
          <strong>Draft.</strong> This post is unlisted — it is here for review
          and may change before it is published.
        </p>
      )}
      {post.images && (
        <Image
          src={post.images.banner}
          alt=""
          width={1600}
          height={900}
          priority
          className="mb-8 aspect-video w-full rounded-lg object-cover"
        />
      )}
      <header className="mb-8 border-l-2 border-accent pl-4">
        <h1 className="text-3xl font-bold tracking-tight">{post.title}</h1>
        <p className="mt-2 text-sm text-muted">
          {post.kind === "note" && (
            <span className="mr-2 tracking-wider">NOTE ·</span>
          )}
          <time dateTime={post.date}>{formatDate(post.date)}</time>
          {post.updated && (
            <>
              {" "}
              · updated{" "}
              <time dateTime={post.updated}>{formatDate(post.updated)}</time>
            </>
          )}{" "}
          · {post.readingMinutes} min read
        </p>
        {post.tags.length > 0 && <TagList tags={post.tags} className="mt-2" />}
      </header>
      {post.tldr.length > 0 && <Tldr items={post.tldr} />}
      <Toc headings={post.headings} />
      <div
        className="prose prose-neutral dark:prose-invert max-w-none"
        dangerouslySetInnerHTML={{ __html: post.html }}
      />
    </article>
  );
}
