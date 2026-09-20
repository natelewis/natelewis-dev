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

export type PostMeta = {
  slug: string;
  title: string;
  date: string; // ISO yyyy-mm-dd
  description: string;
  tags: string[];
  accent: string; // per-post accent colour, any CSS colour
  draft: boolean;
};

export type Post = PostMeta & { html: string; readingMinutes: number };

const DEFAULT_ACCENT = "#0ea5e9";

function readMeta(file: string): PostMeta & { content: string } {
  const slug = file.replace(/\.md$/, "");
  const raw = fs.readFileSync(path.join(POSTS_DIR, file), "utf8");
  const { data, content } = matter(raw);
  return {
    slug,
    title: String(data.title ?? slug),
    date: String(data.date ?? "1970-01-01"),
    description: String(data.description ?? ""),
    tags: Array.isArray(data.tags) ? data.tags.map(String) : [],
    accent: String(data.accent ?? DEFAULT_ACCENT),
    draft: Boolean(data.draft ?? false),
    content,
  };
}

/** All published posts, newest first. Drafts are only visible in dev. */
export function getAllPosts(): PostMeta[] {
  if (!fs.existsSync(POSTS_DIR)) return [];
  return fs
    .readdirSync(POSTS_DIR)
    .filter((f) => f.endsWith(".md"))
    .map(readMeta)
    .filter((p) => !p.draft || process.env.NODE_ENV === "development")
    .sort((a, b) => (a.date < b.date ? 1 : -1))
    .map((p) => {
      const { content: _, ...meta } = p;
      void _;
      return meta;
    });
}

export function getPostSlugs(): string[] {
  return getAllPosts().map((p) => p.slug);
}

export async function getPost(slug: string): Promise<Post | null> {
  const file = `${slug}.md`;
  if (!fs.existsSync(path.join(POSTS_DIR, file))) return null;
  const { content, ...meta } = readMeta(file);
  if (meta.draft && process.env.NODE_ENV !== "development") return null;

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
