/**
 * The four things the site is about, as the header mark. Each topic owns a
 * set of tags; a page whose tags overlap a topic lights that glyph up, and
 * the glyph links to the topic's busiest tag page. Add a tag here when a new
 * one belongs under one of the four; a tag in no topic is fine, it just
 * doesn't light anything.
 */
export type Topic = {
  key: "software-engineering" | "agents" | "music" | "hardware";
  label: string;
  tags: string[];
};

export const TOPICS: Topic[] = [
  {
    key: "software-engineering",
    label: "Software engineering",
    tags: [
      "software-engineering",
      "ci",
      "github-actions",
      "testing",
      "nextjs",
      "firebase",
      "auth",
      "typescript",
      "react",
      "civic-tech",
    ],
  },
  {
    key: "agents",
    label: "Agents",
    tags: ["agents", "llm", "ollama", "prompting", "nlp", "mcp", "ai"],
  },
  {
    key: "music",
    label: "Music",
    tags: ["music", "fl-studio", "karaoke", "drums", "guitar", "audio", "midi"],
  },
  {
    key: "hardware",
    label: "Hardware",
    tags: [
      "hardware",
      "raspberry-pi",
      "led",
      "electronics",
      "arduino",
      "3d-printing",
    ],
  },
];

/** Topic keys a set of tags belongs to, for the `data-topics` attribute. */
export function topicsForTags(tags: string[]): string {
  return TOPICS.filter((t) => t.tags.some((tag) => tags.includes(tag)))
    .map((t) => t.key)
    .join(" ");
}
