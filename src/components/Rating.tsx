import { overallStars, type RatingAspect } from "@/lib/posts";

/**
 * Five stars filled to `value`. The filled row is the same glyphs laid over
 * the empty one and clipped, so a half star is a clip at 10% of the width
 * rather than a different character.
 */
export function Stars({
  value,
  className = "",
}: {
  value: number;
  className?: string;
}) {
  const filled = (Math.min(5, Math.max(0, value)) / 5) * 100;
  return (
    <span
      className={`relative inline-block whitespace-nowrap leading-none ${className}`}
    >
      <span
        aria-hidden="true"
        className="text-[color-mix(in_srgb,var(--foreground)_22%,transparent)]"
      >
        ★★★★★
      </span>
      <span
        aria-hidden="true"
        className="absolute inset-y-0 left-0 overflow-hidden text-accent"
        style={{ width: `${filled}%` }}
      >
        ★★★★★
      </span>
      <span className="sr-only">{value} out of 5</span>
    </span>
  );
}

/**
 * A review's scorecard, where a post has its TL;DR: the parts of the thing
 * that mattered, each out of five, and the mean of them at the top. A reader
 * who stops here still knows what I thought.
 */
export function Rating({ rating }: { rating: RatingAspect[] }) {
  const overall = overallStars(rating);
  if (overall === null) return null;
  return (
    <aside
      aria-label="Rating"
      className="mb-10 rounded-lg border border-border border-l-4 border-l-accent bg-[color-mix(in_srgb,var(--foreground)_4%,var(--background))] px-5 py-4"
    >
      <div className="mb-3 flex items-baseline justify-between gap-4">
        <p className="text-xs font-semibold tracking-widest text-accent">
          RATING
        </p>
        <p className="flex items-baseline gap-2">
          <Stars value={overall} className="text-lg" />
          <span className="text-lg font-semibold tabular-nums">{overall}</span>
          <span className="text-sm text-muted">/ 5</span>
        </p>
      </div>
      <dl className="m-0 space-y-2 text-[0.95rem]">
        {rating.map((row) => (
          <div
            key={row.aspect}
            className="flex flex-wrap items-baseline gap-x-3 gap-y-1"
          >
            <dt className="min-w-36 font-medium">{row.aspect}</dt>
            <dd className="m-0 flex items-baseline gap-2">
              <Stars value={row.stars} />
              <span className="text-sm tabular-nums text-muted">
                {row.stars}
              </span>
            </dd>
            {row.note && (
              <dd className="m-0 basis-full text-sm text-muted sm:basis-auto">
                {row.note}
              </dd>
            )}
          </div>
        ))}
      </dl>
    </aside>
  );
}
