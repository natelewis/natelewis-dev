@AGENTS.md

# natelewis.dev

Personal blog. See README.md for the full picture.

- Posts live in `content/posts/*.md`; front matter schema is in `src/lib/posts.ts`.
- Markdown → HTML happens at build time in `src/lib/posts.ts` (unified/remark/rehype + Shiki).
  There is no CMS, no database, and no client-side fetching — keep everything prerendered.
- Site-wide constants (name, URL, description) are in `src/lib/site.ts`.
- Theme follows `prefers-color-scheme`; colours are CSS vars in `src/app/globals.css`.
  Per-post `accent` is applied by setting `--accent` inline on the article.
- `next.config.ts` uses `output: "standalone"`; the Dockerfile depends on that.
- Deploy: push to `main` → `.github/workflows/deploy.yml` → Artifact Registry → Cloud Run.
- Verify a change with `npm run lint && npm run build`; for the container, `docker build .`.
