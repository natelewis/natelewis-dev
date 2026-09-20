import Link from "next/link";
import { formatDate, type PostMeta } from "@/lib/posts";

export function PostList({ posts }: { posts: PostMeta[] }) {
  if (posts.length === 0) {
    return <p className="text-muted">Nothing here yet.</p>;
  }
  return (
    <ul className="space-y-8">
      {posts.map((p) => (
        <li key={p.slug} style={{ "--accent": p.accent } as React.CSSProperties}>
          <article className="border-l-2 border-accent pl-4">
            <h2 className="text-lg font-semibold tracking-tight">
              <Link href={`/blog/${p.slug}`} className="hover:text-accent">
                {p.title}
              </Link>
            </h2>
            <p className="mt-1 text-sm text-muted">
              <time dateTime={p.date}>{formatDate(p.date)}</time>
              {p.tags.length > 0 && <> · {p.tags.join(", ")}</>}
            </p>
            {p.description && <p className="mt-2">{p.description}</p>}
          </article>
        </li>
      ))}
    </ul>
  );
}
