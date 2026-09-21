import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import remarkRehype from "remark-rehype";
import rehypeSlug from "rehype-slug";
import rehypeAutolinkHeadings from "rehype-autolink-headings";
import rehypePrettyCode from "rehype-pretty-code";
import rehypeStringify from "rehype-stringify";

const POSTS_DIR = path.join(process.cwd(), "content", "posts");
const PUBLIC_DIR = path.join(process.cwd(), "public");

/**
 * The front matter every post carries. Bump SCHEMA_VERSION when a field's
 * meaning changes, not when one is added: a post written against an older
 * schema keeps rendering, and `npm run check-post` says which posts are behind
 * so they can be brought forward deliberately rather than reformatted en masse.
 */
export const SCHEMA_VERSION = 2;

export type PostMeta = {
  slug: string;
  schema: number;
  title: string;
  date: string; // ISO yyyy-mm-dd; controls ordering, and is the published date
  updated: string | null; // ISO yyyy-mm-dd when materially revised after publishing
  description: string;
  /**
   * Schema 2. Three to five bullets a reader can act on without reading the
   * post: what was wrong, what fixed it, what it cost or won, the one rule.
   * Rendered as a box under the title and used as the article's abstract.
   */
  tldr: string[];
  tags: string[];
  accent: string; // per-post accent colour, any CSS colour
  /**
   * A draft is built and served — the URL works for anyone who has it — but
   * it is left out of the home page, /blog, tag pages, RSS and the sitemap,
   * and carries noindex. Not secure; just not discoverable. Flip to false to
   * publish.
   */
  draft: boolean;
  /** The scene the banner was generated from; the style lives in scripts/banner.mjs. */
  banner: string | null;
  /** Public URLs of the banner and its thumbnail, when the files exist. */
  images: { banner: string; thumb: string } | null;
};

export type Heading = { id: string; text: string; level: 2 | 3 };
export type Post = PostMeta & {
  html: string;
  readingMinutes: number;
  headings: Heading[];
};

/** The h2/h3s of rendered HTML, for a table of contents. rehype-slug gave them ids. */
function extractHeadings(html: string): Heading[] {
  const out: Heading[] = [];
  const re = /<h([23]) id="([^"]+)">(.*?)<\/h\1>/g;
  for (const m of html.matchAll(re)) {
    const text = m[3]
      .replace(/<[^>]+>/g, "")
      .replace(/&amp;/g, "&")
      .replace(/&#x27;/g, "'")
      .replace(/&quot;/g, '"');
    out.push({ id: m[2], text, level: Number(m[1]) as 2 | 3 });
  }
  return out;
}

const DEFAULT_ACCENT = "#0ea5e9";

/** By convention, images live at public/posts/<slug>/{banner,thumb}.webp. */
function findImages(slug: string): PostMeta["images"] {
  const dir = path.join(PUBLIC_DIR, "posts", slug);
  const banner = path.join(dir, "banner.webp");
  const thumb = path.join(dir, "thumb.webp");
  if (!fs.existsSync(banner)) return null;
  return {
    banner: `/posts/${slug}/banner.webp`,
    thumb: fs.existsSync(thumb)
      ? `/posts/${slug}/thumb.webp`
      : `/posts/${slug}/banner.webp`,
  };
}

const isoDate = (value: unknown): string | null => {
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value))
    return value;
  return null;
};

export function readMeta(file: string): PostMeta & { content: string } {
  const slug = file.replace(/\.md$/, "");
  const raw = fs.readFileSync(path.join(POSTS_DIR, file), "utf8");
  const { data, content } = matter(raw);
  return {
    slug,
    schema: Number(data.schema ?? 0),
    title: String(data.title ?? slug),
    date: isoDate(data.date) ?? "1970-01-01",
    updated: isoDate(data.updated),
    description: String(data.description ?? ""),
    tldr: Array.isArray(data.tldr) ? data.tldr.map(String).filter(Boolean) : [],
    tags: Array.isArray(data.tags)
      ? data.tags.map((t) => String(t).toLowerCase())
      : [],
    accent: String(data.accent ?? DEFAULT_ACCENT),
    draft: Boolean(data.draft ?? false),
    banner: data.banner ? String(data.banner) : null,
    images: findImages(slug),
    content,
  };
}

function readAll(): Array<PostMeta & { content: string }> {
  if (!fs.existsSync(POSTS_DIR)) return [];
  return fs
    .readdirSync(POSTS_DIR)
    .filter((f) => f.endsWith(".md"))
    .map(readMeta)
    .sort((a, b) => (a.date < b.date ? 1 : -1));
}

const stripContent = (p: PostMeta & { content: string }): PostMeta => {
  const { content: _, ...meta } = p;
  void _;
  return meta;
};

/** Published posts, newest first. Drafts are listed only in dev, so they can be checked locally. */
export function getAllPosts(): PostMeta[] {
  return readAll()
    .filter((p) => !p.draft || process.env.NODE_ENV === "development")
    .map(stripContent);
}

/** Every post including drafts: the pages that must exist, whether or not they are listed. */
export function getPostSlugs(): string[] {
  return readAll().map((p) => p.slug);
}

/** Tags across published posts with their counts, most used first. */
export function getAllTags(): Array<{ tag: string; count: number }> {
  const counts = new Map<string, number>();
  for (const post of getAllPosts()) {
    for (const tag of post.tags) counts.set(tag, (counts.get(tag) ?? 0) + 1);
  }
  return [...counts]
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count || a.tag.localeCompare(b.tag));
}

export function getPostsByTag(tag: string): PostMeta[] {
  return getAllPosts().filter((p) => p.tags.includes(tag.toLowerCase()));
}

export async function getPost(slug: string): Promise<Post | null> {
  const file = `${slug}.md`;
  if (!fs.existsSync(path.join(POSTS_DIR, file))) return null;
  const { content, ...meta } = readMeta(file);

  const result = await unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkRehype)
    .use(rehypeSlug)
    .use(rehypeAutolinkHeadings, { behavior: "wrap" })
    .use(rehypePrettyCode, {
      theme: { light: "github-light", dark: "github-dark" },
      keepBackground: false,
    })
    .use(rehypeStringify)
    .process(content);

  const words = content.split(/\s+/).filter(Boolean).length;
  return {
    ...meta,
    html: String(result),
    readingMinutes: Math.max(1, Math.round(words / 220)),
    headings: extractHeadings(String(result)),
  };
}

export function formatDate(iso: string): string {
  return new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  });
}
