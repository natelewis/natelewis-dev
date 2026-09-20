# natelewis.dev

Personal blog. Next.js 16 (App Router) + Tailwind v4, posts as Markdown,
built into a standalone Docker image and served from Google Cloud Run
(scales to zero). Every push to `main` deploys via GitHub Actions using
Workload Identity Federation — no stored service-account keys.

## Writing a post

Add `content/posts/<slug>.md`:

```yaml
---
title: "Post title"
date: "2026-09-20"          # ISO date; controls ordering
description: "One-liner shown in lists, RSS, and <meta>."
tags: ["tag"]               # optional
accent: "#0ea5e9"           # optional per-post accent colour
draft: true                 # optional; drafts only render in `npm run dev`
---

Markdown body. GFM tables/footnotes, fenced code with Shiki highlighting.
```

Commit, push to `main`, done. The URL is `/blog/<slug>`.

## Local dev

```bash
npm install
npm run dev        # http://localhost:3000
npm run build      # production build (standalone output)
docker build -t natelewis-dev . && docker run -p 8080:8080 natelewis-dev
```

## Routes

`/`, `/blog`, `/blog/[slug]`, `/about`, `/rss.xml`, `/sitemap.xml`, `/robots.txt` —
all prerendered at build time.

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
