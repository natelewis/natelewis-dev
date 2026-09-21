import Link from "next/link";
import { UMBRELLA_TAGS } from "@/lib/topics";

/**
 * Tags as links to their pages; one look everywhere a tag appears. Umbrella
 * tags are left out: every post has them, so the pill would say nothing.
 */
export function TagList({ tags, className = "" }: { tags: string[]; className?: string }) {
  const shown = tags.filter((tag) => !UMBRELLA_TAGS.includes(tag));
  if (shown.length === 0) return null;
  return (
    <ul className={`flex flex-wrap gap-2 text-xs ${className}`}>
      {shown.map((tag) => (
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
