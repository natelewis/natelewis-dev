import Image from "next/image";
import Link from "next/link";
import { TagList } from "@/components/TagList";
import { formatDate, type PostMeta } from "@/lib/posts";

export function PostList({ posts }: { posts: PostMeta[] }) {
  if (posts.length === 0) {
    return <p className="text-muted">Nothing here yet.</p>;
  }
  return (
    <ul className="space-y-8">
      {posts.map((p) => (
        <li key={p.slug} style={{ "--accent": p.accent } as React.CSSProperties}>
          <article className="flex gap-4 border-l-2 border-accent pl-4">
            {p.images && (
              <Link href={`/blog/${p.slug}`} className="hidden shrink-0 sm:block">
                <Image
                  src={p.images.thumb}
                  alt=""
                  width={160}
                  height={90}
                  className="aspect-video w-40 rounded object-cover"
                />
              </Link>
            )}
            <div className="min-w-0">
              <h2 className="text-lg font-semibold tracking-tight">
                <Link href={`/blog/${p.slug}`} className="hover:text-accent">
                  {p.title}
                </Link>
                {p.draft && (
                  <span className="ml-2 align-middle text-xs font-normal text-accent">draft</span>
                )}
              </h2>
              <p className="mt-1 text-sm text-muted">
                <time dateTime={p.date}>{formatDate(p.date)}</time>
              </p>
              {p.description && <p className="mt-2">{p.description}</p>}
              {p.tags.length > 0 && <TagList tags={p.tags} className="mt-2" />}
            </div>
          </article>
        </li>
      ))}
    </ul>
  );
}
