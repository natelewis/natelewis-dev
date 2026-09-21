import Link from "next/link";
import { getAllTags } from "@/lib/posts";
import { TOPICS, type Topic } from "@/lib/topics";

/** One glyph per topic, drawn on a 24-unit grid with a 1.75 stroke. */
const GLYPHS: Record<Topic["key"], React.ReactNode> = {
  "software-engineering": (
    <>
      <path d="M8.5 6.5 3 12l5.5 5.5" />
      <path d="M15.5 6.5 21 12l-5.5 5.5" />
      <path d="M14 4.5 10 19.5" />
    </>
  ),
  agents: (
    <>
      <rect x="4" y="8.5" width="16" height="11.5" rx="3" />
      <path d="M12 8.5V5" />
      <circle cx="12" cy="3.75" r="1.25" />
      <circle cx="9" cy="14" r="1.1" fill="currentColor" stroke="none" />
      <circle cx="15" cy="14" r="1.1" fill="currentColor" stroke="none" />
      <path d="M9.5 17.25h5" />
    </>
  ),
  music: (
    <>
      <ellipse
        cx="7"
        cy="17.5"
        rx="2.6"
        ry="1.9"
        fill="currentColor"
        stroke="none"
        transform="rotate(-18 7 17.5)"
      />
      <ellipse
        cx="17"
        cy="15.5"
        rx="2.6"
        ry="1.9"
        fill="currentColor"
        stroke="none"
        transform="rotate(-18 17 15.5)"
      />
      <path d="M9.4 17V6.5" />
      <path d="M19.4 15V4.5" />
      <path
        d="M9.4 6.5 19.4 4.5v3.4l-10 2z"
        fill="currentColor"
        stroke="none"
      />
    </>
  ),
  hardware: (
    <>
      <rect x="7" y="7" width="10" height="10" rx="1.5" />
      <rect
        x="10.25"
        y="10.25"
        width="3.5"
        height="3.5"
        rx=".5"
        fill="currentColor"
        stroke="none"
      />
      <path d="M9.5 7V4M12 7V4M14.5 7V4M9.5 17v3M12 17v3M14.5 17v3M7 9.5H4M7 12H4M7 14.5H4M17 9.5h3M17 12h3M17 14.5h3" />
    </>
  ),
};

/**
 * The header mark: the four topics as glyphs. Each links to the topic's
 * busiest existing tag page (or /tags if none of its tags has a post yet),
 * and lights up on any page whose tags fall under it — see the
 * `body:has([data-topics~=…])` rules in globals.css.
 */
export function TopicMarks() {
  const counts = new Map(getAllTags().map(({ tag, count }) => [tag, count]));
  return (
    <div className="flex items-center gap-3" aria-label="Topics">
      {TOPICS.map((topic) => {
        const best = topic.tags
          .filter((t) => counts.has(t))
          .sort((a, b) => (counts.get(b) ?? 0) - (counts.get(a) ?? 0))[0];
        return (
          <Link
            key={topic.key}
            href={best ? `/tags/${best}` : "/tags"}
            title={topic.label}
            aria-label={topic.label}
            className={`topic topic-${topic.key} text-muted transition-colors hover:text-foreground`}
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.75"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              {GLYPHS[topic.key]}
            </svg>
          </Link>
        );
      })}
    </div>
  );
}
