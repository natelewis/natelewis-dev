import Link from "next/link";

/** Tags as links to their pages; one look everywhere a tag appears. */
export function TagList({ tags, className = "" }: { tags: string[]; className?: string }) {
  return (
    <ul className={`flex flex-wrap gap-2 text-xs ${className}`}>
      {tags.map((tag) => (
        <li key={tag}>
          <Link
            href={`/tags/${encodeURIComponent(tag)}`}
            className="rounded-full border border-border px-2 py-0.5 text-muted hover:border-accent hover:text-accent"
          >
            #{tag}
          </Link>
        </li>
      ))}
    </ul>
  );
}
