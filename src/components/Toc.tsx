import type { Heading } from "@/lib/posts";

/** Contents for a post: h2s with their h3s, collapsed by default so it reads as a map, not a wall. */
export function Toc({ headings }: { headings: Heading[] }) {
  const shown = headings.filter((h) => h.text !== "Links");
  if (shown.length < 3) return null;
  return (
    <details className="group mb-10 rounded-lg border border-border px-5 py-3 text-sm">
      <summary className="cursor-pointer select-none text-xs font-semibold tracking-widest text-muted group-open:mb-2">
        CONTENTS
      </summary>
      <ol className="space-y-1">
        {shown.map((h) => (
          <li key={h.id} className={h.level === 3 ? "pl-4 text-muted" : ""}>
            <a href={`#${h.id}`} className="hover:text-accent">
              {h.text}
            </a>
          </li>
        ))}
      </ol>
    </details>
  );
}
