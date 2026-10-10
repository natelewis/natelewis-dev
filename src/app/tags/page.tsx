import type { Metadata } from "next";
import Link from "next/link";
import { getAllTags } from "@/lib/posts";
import { UMBRELLA_TAGS } from "@/lib/topics";
import { site } from "@/lib/site";
import { JsonLd, person } from "@/components/JsonLd";

const description =
  "Posts by topic: agents, LLMs, prompting, ollama, CI, testing, Next.js, Firebase, auth and more.";

export const metadata: Metadata = {
  title: "Tags",
  description,
};

export default function TagsIndex() {
  const tags = getAllTags().filter(({ tag }) => !UMBRELLA_TAGS.includes(tag));
  return (
    <>
      <JsonLd
        data={{
          "@type": "CollectionPage",
          name: "Tags",
          url: `${site.url}/tags`,
          description,
          isPartOf: { "@type": "WebSite", name: site.title, url: site.url },
          author: person,
          mainEntity: {
            "@type": "ItemList",
            numberOfItems: tags.length,
            itemListElement: tags.map(({ tag }, i) => ({
              "@type": "ListItem",
              position: i + 1,
              name: `#${tag}`,
              url: `${site.url}/tags/${encodeURIComponent(tag)}`,
            })),
          },
        }}
      />
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
