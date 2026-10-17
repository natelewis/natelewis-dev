@AGENTS.md

# natelewis.dev

Personal blog. See README.md for the full picture.

- Posts live in `content/posts/*.md`; front matter schema is in `src/lib/posts.ts`
  (`SCHEMA_VERSION`). Scaffold with `npm run new-post`, gate with `npm run check-post`.
- The front matter is fixed; the body is not. A post takes whatever shape its
  story has, with its own `##` headings (`--shape free`, the default). The
  problem-and-fix sections are `--shape walkthrough`, one option among others,
  not the house style; `--shape review` is a place. Nothing downstream depends
  on a particular heading.
- Images are by convention at `public/posts/<slug>/{banner,thumb}.webp`.
  `npm run banner` draws them with Gemini from the post's `banner:` scene, and the
  house style is `STYLE` in `scripts/banner.mjs`, never in a post. `npm run photo`
  builds them from real photographs instead and records the sources in
  `public/posts/<slug>/photos.json`. Photographs that are someone else's carry
  `imageCredit`/`imageCreditUrl`, which render as a credit under the banner.
- `kind` is `post` or `review`. A review (`--shape review`) is scored
  instead of summarised: `rating:` is a list of `{aspect, stars, note}`, the overall
  is their mean (never a field), and it renders where a post's TL;DR goes, feeds
  schema.org `Review` structured data, and lists on `/reviews`. There is no short
  form: a short post is a post.
- `draft: true` is *unlisted*, not hidden: the page builds and serves, but is left
  out of every listing, feed and sitemap and carries noindex.
- Markdown → HTML happens at build time in `src/lib/posts.ts` (unified/remark/rehype + Shiki).
  There is no CMS, no database, and no client-side fetching — keep everything prerendered.
- Site-wide constants (name, URL, description) are in `src/lib/site.ts`. The header
  glyphs are the topics in `src/lib/topics.ts`; a page's tags light the matching one
  (`TopicMarks`, plus the `:has()` rules in `globals.css`), and a topic with no
  published posts is left out of the header.
- Theme follows `prefers-color-scheme`; colours are CSS vars in `src/app/globals.css`.
  Per-post `accent` is applied by setting `--accent` inline on the article.
- `next.config.ts` uses `output: "standalone"`; the Dockerfile depends on that.
- Deploy: push to `main` → `.github/workflows/deploy.yml` → Artifact Registry → Cloud Run.
- Verify a change with `npm run lint && npm run build`; for the container, `docker build .`.
