---
schema: 2
title: "We went public, and Googlebot found every weak spot in five days"
date: "2026-10-09"
description: "A site with 29,000 generated pages went public. Under the crawl it served real pages as \"not found\" and spent 95% of one section on filter links."
tldr:
  - "Under a crawl, real pages came back as \"not found\" with a 200 and noindex, and the CDN cached them."
  - "Letting the error through as a 500 fixed it: Google retries a 500 and drops a page that says it is gone."
  - "95% of Googlebot's member-page requests were filter links. robots.txt took that to 0; the canonical tag never would have."
  - "Read what Googlebot was served from your request logs. Search Console tells you weeks later."
tags: ["software-engineering", "civic-tech", "agents", "seo"]
accent: "#16a34a"
draft: true
banner: "A person in a ball cap stands at a server rack at night, holding a clipboard, while a long line of identical small robots with spider legs queues out of the rack's open door and down a corridor. Most of the robots have wandered into a side room full of identical doors labelled with filters, and only a few are walking through the main door."
---

<!--
Who: someone who just launched a database-backed site with thousands of generated pages and is staring at "Discovered – currently not indexed".
Leave with: read what Googlebot was served from the request logs; a failed read must not render as "not found"; a canonical tag does not stop crawling.
Turn: the pages were not slow so much as wrong, and the crawl was mostly going to pages that did not need crawling.
-->

I built [Congress For Voters](https://congressforvoters.com), which reads
everything Congress publishes and turns it into pages a voter can read: about 19,000 bills, 7,000 amendments, 1,600
roll-call votes and 555 members, all generated. It went public on 2
October. Five days later I had an agent read Google's crawl out of the
host's request logs, and **the problem was not that the pages were slow.
Under load, some of them were wrong**: real members served as "not
found", with a 200 and `noindex`, cached by the CDN for everyone after.

The other surprise was where the crawl went. **95% of Googlebot's visits to
member pages were to filtered copies of them**, so in a week it reached
130 distinct member pages, for 555 members.

## The problem

A week in, Search Console showed 284 impressions, and none of a sample of
16 bill, member, vote and amendment pages were indexed. That is normal for
a new site, and Search Console reports it weeks late without saying why.

The request logs say why. I had the agent write a script that pulls
Googlebot's requests from the host's logs and groups them by section of the
site: how many, how many distinct pages, how many with a query string, how
many errors, how slow. It also counts **200s that are suspiciously small**.
A member page is a few hundred kilobytes, so one under 20 KB is an error
page with a 200 on it.

The week before:

| | Googlebot requests | distinct pages | with a query string | p90 |
|---|---|---|---|---|
| bills | 8,383 | 7,189 | 0% | 0.59 s |
| member pages | 2,818 | 130 | **95%** | **51 s** |

On one day, 438 member responses were under 20 KB. They covered 18 real
members.

## What I tried

### A failed read is not an empty result

The queries that load a record caught their own errors:

```ts
// before: a timeout here becomes "this member does not exist"
export const getMember = async (id: string) => {
  try {
    return await fetchMember(id);
  } catch (e) {
    logger.error(e);
    return null;
  }
};
```

and the page did what a page does with `null`: rendered "not found", set
`noindex`, and returned 200. Under a crawl the database ran out of
connections, the query timed out, and a real member became a page telling
Google to drop it.

The fix was to stop catching, so the response becomes a 500. **Google
retries a 500. A 200 that says "not found" tells it the page is gone.** The
agent found the same pattern in seventeen more places: a bill saying "no
amendments submitted yet" when the read had failed, a count of 0, "no
votes in the last 14 days".

### The crawl trap

Of 2,815 Googlebot requests to member pages, 2,619 were the same page with
`?affects=` on the end. Every member page linked 114 views filtered to one
policy area ("bills affecting veterans"), each one a full render, each with
a canonical tag pointing back at the member. Googlebot fetched every one to
find that out. **A canonical tag is read after the fetch.** It tells Google
which URL to index, not which ones to skip.

robots.txt is what stops the fetch:

```text
Disallow: /*?affects=
Disallow: /*&affects=
# …one pair per filter parameter
```

The filter links also got `rel="nofollow"`. They still work for a person
clicking them.

### The rest of the list

The web server was also being killed for running out of memory 15 to 34
times a day, and it accepted 80 requests at once in front of 5 database
connections, so a crawl piled onto one instance and timed out. More memory
and fewer requests per instance fixed that.

And one page type, a day of the Congressional Record, took up to 46
seconds. A function that links members' names copied the rest of the
document at every character, eight times. Rewriting it took that page to
under 2 seconds.

## What happened

From Googlebot's own requests in the logs, before and after:

| | before | after |
|---|---|---|
| member requests with a query string | 95% | 0% |
| requests in a day | ~2,000 | 7,233 |
| of those, to bill pages | ~1,200 | 6,360 |
| p90 | 4.4 s | 0.53 s |
| 5xx | 90 in a week | 0 |

Fetching the site 6 pages at a time, the false "not found" pages and the
500s went from 2 each to 0.

Indexing has moved less clearly. Five of six bill pages sampled from the
sitemap were indexed by 9 October, but the earlier sample covered every
page type, so it is not a clean before and after. Member pages are still a
mix of "crawled – currently not indexed" and unknown to Google.

## Where it landed

The site returns an error when it cannot read, and the crawl goes to
records instead of filter views. **Whether Google indexes more of it is
still open.** Impressions went from 284 to 801 in the rolling four-week
window, but that window overlaps the launch, so I cannot credit any one
change yet.

The agent that found all of this now runs every morning. It reads Search
Console and the crawl log, opens at most one pull request per site, and
keeps a ledger of each change with the numbers from before it, judged two
to four weeks after it ships. The first verdicts land on 14 and 23 October.

## Links

- [Google: How to consolidate duplicate URLs](https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls), on what a canonical tag does and does not do
- [Google: Introduction to robots.txt](https://developers.google.com/search/docs/crawling-indexing/robots/intro)
- [Google: HTTP status codes and how they affect Google Search](https://developers.google.com/search/docs/crawling-indexing/http-network-errors)
- [Congress For Voters](https://congressforvoters.com), the site this is about
- [An earlier post on the same project](/blog/sparse-ranking-prompt), on making its LLM scoring step cheaper
