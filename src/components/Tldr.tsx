/** The post in three to five bullets, so a reader can decide whether to stay. */
export function Tldr({ items }: { items: string[] }) {
  return (
    <aside
      aria-label="Summary"
      className="mb-10 rounded-lg border border-border border-l-4 border-l-accent bg-[color-mix(in_srgb,var(--foreground)_4%,var(--background))] px-5 py-4"
    >
      <p className="mb-2 text-xs font-semibold tracking-widest text-accent">
        TL;DR
      </p>
      <ul className="m-0 list-disc space-y-1.5 pl-5 text-[0.95rem] leading-relaxed">
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </aside>
  );
}
