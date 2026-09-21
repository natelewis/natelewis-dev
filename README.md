# natelewis.dev

Personal blog. Next.js 16 (App Router) + Tailwind v4, posts as Markdown,
built into a standalone Docker image and served from Google Cloud Run
(scales to zero). Every push to `main` deploys via GitHub Actions using
Workload Identity Federation — no stored service-account keys.

## Writing a post

```bash
npm run new-post -- <slug> --title "..." --date 2026-09-20 --tags gov-data,ai
```

That writes `content/posts/<slug>.md` from the template. The front matter:

```yaml
---
schema: 2                   # the front-matter version; see src/lib/posts.ts
kind: post                  # or note; see Notes below
title: "A claim, not a topic"
date: "2026-09-20"          # ISO; the published date, and the ordering. Backdate freely.
updated: "2026-10-01"       # optional; only for a material revision after publishing
description: "One sentence, ≤160 chars, shown in lists, RSS and <meta>."
tldr:                       # 3–4 one-line bullets; rendered in a box under the
  - "The surprise."                         # title, and as the article's abstract
  - "The fix, with its number."             # in the JSON-LD for search engines
  - "The rule."
tags: ["gov-data", "ai"]    # lowercase kebab-case; reuse existing tags first
accent: "#0ea5e9"           # per-post accent colour
draft: true                 # unlisted until false — see below
banner: "The scene for the banner image, in a sentence or two."
---
```

The body keeps the template's `##` headings — **The problem · What I tried ·
What happened · Where it landed · Links** — so every post can be enhanced the
same way later (a contents block, a summary on the list, related posts by tag)
without reformatting old ones. One `###` per attempt under *What I tried*.
GFM tables and footnotes work; fenced code is highlighted by Shiki at build time.

### Notes

```bash
npm run new-post -- <slug> --note --title "..." --tags a,b
```

A note is one finding in a few hundred words: `kind: note` in the front
matter, no template sections, and no banner or TL;DR asked of it. Same
folder, same `/blog/<slug>` URL, same tags; it is listed with the posts and
on `/notes`, labelled, and `check-post` warns past ~400 words.

### Banner and thumbnail

```bash
npm run banner -- <slug>            # needs GEMINI_API_KEY in .env.local (gitignored)
```

Generates `public/posts/<slug>/banner.webp` (1600×900, top of the post) and
`thumb.webp` (480×270, beside the entry on lists) with Gemini's image model.
The *scene* comes from the post's `banner:`; the *style* is `STYLE` in
`scripts/banner.mjs`, one place, so the whole site is drawn the same way and
the avatar is passed as a reference so the recurring character stays the same
person. To change a banner, change the scene and re-run — never hand-edit the
output, so it stays reproducible. A post with no images renders without them.

### Check before it leaves the machine

```bash
npm run check-post -- <slug>        # or with no slug: every post
```

Errors (which fail the run): front matter the site cannot render, and
anything that looks like a secret or private detail — API keys, tokens,
`KEY=value` lines, home paths, private IPs, email addresses. Warnings: no
banner, an empty template section, template comments left in, no external
links, a post behind the current schema. It is a pattern scan; what is
confidential in substance still needs a person to read it.

### Drafts are unlisted, not hidden

`draft: true` builds and deploys the page — `/blog/<slug>` works for anyone
with the link — but keeps it out of the home page, `/blog`, tag pages, RSS
and the sitemap, and adds `noindex`. That is what makes it a review link to
pass around. It is not access control. In `npm run dev` drafts are listed
too, so the list rendering can be checked. Set `draft: false` to publish;
set `date` to when the work happened if it is older than today.

### Tags

`/tags` lists every tag on published posts with counts; `/tags/<tag>` lists
the posts. Tags on a post and in lists link there.

Commit, push to `main`, done. The URL is `/blog/<slug>`.

## Local dev

```bash
npm install
npm run dev        # http://localhost:3000
npm run build      # production build (standalone output)
docker build -t natelewis-dev . && docker run -p 8080:8080 natelewis-dev
```

## Routes

`/`, `/blog`, `/blog/[slug]`, `/tags`, `/tags/[tag]`, `/about`, `/rss.xml`,
`/sitemap.xml`, `/robots.txt` — all prerendered at build time.

## One-time GCP setup

Everything below is idempotent; re-running is safe. Replace `PROJECT_ID`.

```bash
PROJECT_ID=natelewis-dev
REGION=us-central1
GH_REPO=natelewis/natelewis-dev

gcloud projects create $PROJECT_ID          # then attach billing in the console
gcloud config set project $PROJECT_ID
gcloud services enable run.googleapis.com artifactregistry.googleapis.com \
  iamcredentials.googleapis.com sts.googleapis.com

# Image repo (add a cleanup policy so old images don't accumulate)
gcloud artifacts repositories create web --repository-format=docker --location=$REGION
cat > /tmp/cleanup.json <<'JSON'
[{"name":"keep-recent","action":{"type":"Keep"},"mostRecentVersions":{"keepCount":5}},
 {"name":"delete-old","action":{"type":"Delete"},"condition":{"olderThan":"2592000s"}}]
JSON
gcloud artifacts repositories set-cleanup-policies web --location=$REGION --policy=/tmp/cleanup.json

# Deploy service account
SA=github-deploy@$PROJECT_ID.iam.gserviceaccount.com
gcloud iam service-accounts create github-deploy --display-name="GitHub Actions deploy"
for role in roles/run.admin roles/artifactregistry.writer roles/iam.serviceAccountUser; do
  gcloud projects add-iam-policy-binding $PROJECT_ID --member="serviceAccount:$SA" --role=$role
done

# Workload Identity Federation for GitHub
PROJECT_NUMBER=$(gcloud projects describe $PROJECT_ID --format='value(projectNumber)')
gcloud iam workload-identity-pools create github --location=global --display-name=GitHub
gcloud iam workload-identity-pools providers create-oidc github \
  --location=global --workload-identity-pool=github \
  --issuer-uri=https://token.actions.githubusercontent.com \
  --attribute-mapping="google.subject=assertion.sub,attribute.repository=assertion.repository" \
  --attribute-condition="assertion.repository=='$GH_REPO'"
gcloud iam service-accounts add-iam-policy-binding $SA \
  --role=roles/iam.workloadIdentityUser \
  --member="principalSet://iam.googleapis.com/projects/$PROJECT_NUMBER/locations/global/workloadIdentityPools/github/attribute.repository/$GH_REPO"

# GitHub secrets consumed by .github/workflows/deploy.yml
gh secret set GCP_PROJECT_ID --body "$PROJECT_ID"
gh secret set WIF_SERVICE_ACCOUNT --body "$SA"
gh secret set WIF_PROVIDER --body "projects/$PROJECT_NUMBER/locations/global/workloadIdentityPools/github/providers/github"
```

After the first successful deploy, map the domain. Cloud Run requires the
domain to be verified with Google first (one-time, via Search Console — it
gives you a TXT record to add at the registrar):

```bash
gcloud domains verify natelewis.dev     # opens Search Console; add the TXT record it shows
gcloud beta run domain-mappings create --service natelewis-dev --domain natelewis.dev --region $REGION
```

That prints the DNS records to add at the registrar (A/AAAA for the apex, plus a
`www` CNAME if wanted). SSL is provisioned automatically once DNS resolves.
