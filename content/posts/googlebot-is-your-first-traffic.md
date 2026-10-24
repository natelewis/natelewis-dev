---
schema: 2
title: "Before a site has visitors, Googlebot is its traffic"
date: "2026-10-09"
description: "A new site has no users to tell you what's broken. Googlebot visits every day. Its requests in your server logs are the monitoring you don't have yet."
tldr:
  - "A brand-new site has no visitors to tell you what's broken, but Googlebot crawls thousands of its pages a day."
  - "Every one of those visits is already in your server logs, so I grouped them by section of the site and watched them."
  - "That showed real pages being served as \"not found\", and 95% of one section's crawl wasted on filter links."
  - "After each fix, the logs showed the result the same day, instead of weeks later in Google Search Console."
tags: ["software-engineering", "civic-tech", "agents", "seo"]
accent: "#16a34a"
draft: false
banner: "A person in a ball cap stands at a server rack at night, holding a clipboard, while a long line of identical small robots with spider legs queues out of the rack's open door and down a corridor. Most of the robots have wandered into a side room full of identical doors labelled with filters, and only a few are walking through the main door."
---
[Congress For Voters](https://congressforvoters.com) went public on 2
October with about 29,000 generated pages and no audience at all.

Analytics was empty. Nobody filed a bug. Search Console reports weeks
behind.

The server was busy anyway. Googlebot was fetching about 2,000 pages a day,
and every one of those requests was already sitting in the host's logs, with
its status, size and time.

So I started treating Googlebot as the traffic. Grouping its requests by
section of the site turned them into the monitoring I didn't have yet.
Within a week it showed real pages being served as "not found", and 95% of
one section's crawl going to filter links. Neither was visible from anywhere
else.

## A site with no visitors gives you no signal

There's no error rate to watch because nobody is erroring. No slow page
anyone complains about. Search Console eventually says "Discovered –
currently not indexed", weeks late, and doesn't say why.

The crawler is the exception. It visits every day. It reaches page types no
person has opened yet, and it fetches several at once, which is the closest
thing a new site gets to a load test.

## Reading the crawl out of the request logs

I had an agent write a small script against the host's request logs. The
filter is one line:

```text
httpRequest.userAgent=~"Googlebot" AND timestamp>="<since>"
```

The user agent can be spoofed. For trends on your own site that's fine; for
a single surprising request, check that the IP reverse-resolves to
`googlebot.com`.

It groups requests by the first segment of the path. Per section it reports:

1. requests, and distinct pages - how much of the section is being seen
2. the share of requests with a query string - crawl spent on variants
3. 5xx and p90 latency
4. 200s that come back suspiciously small

That last one turned out to matter most. A page that's normally hundreds of
kilobytes and comes back at 10 is an error page with a 200 on it. A status
count will never show you that.

| | Googlebot requests | distinct pages | with a query string | p90 |
|---|---|---|---|---|
| bills | 8,383 | 7,189 | 0% | 0.59 s |
| member pages | 2,818 | 130 | 95% | 51 s |

Two rows, two problems.

The small 200s: on one day, 438 member pages came back under 20 KB, covering
18 real members. Under the crawl's load a database read timed out, the code
turned the failure into `null`, and the page rendered "not found" with
`noindex` and a 200. Telling Google to drop a page that exists. The fix was
to let the error through as a 500, which Google retries.

The query strings: every member page linked 114 filtered views of itself,
each with a canonical tag pointing back at the member. A canonical tag is
read after the fetch, which is the part I'd had wrong in my head. Googlebot
fetched all of them, and saw 130 member pages in a week out of 555.
robots.txt is what stops the fetch:

```text
Disallow: /*?affects=
Disallow: /*&affects=
```

The same script takes `--since <deploy time>`, so after each release I ran
it on that day's crawl instead of waiting for Search Console.

## What the logs said a day later

Googlebot's own requests, the week before against the day after the fixes
shipped:

| | before | after |
|---|---|---|
| member requests with a query string | 95% | 0% |
| requests in a day | ~2,000 | 7,233 |
| of those, to bill pages | ~1,200 | 6,360 |
| p90 | 4.4 s | 0.53 s |
| 5xx | 90 in a week | 0 |
| small 200s on member pages | 443 in a week | 0 |

With the trap closed, Googlebot more than tripled its daily crawl and spent
it on the pages that matter. That showed up in the logs within a day.
Search Console's crawl reports run days to weeks behind, so I'd have been
waiting on that into November.

## What I watch now

The script runs every morning alongside Search Console now, and again after
every deploy. Until the site has visitors, the crawler is the only user that
shows up every day and touches every page type, so it's the one I watch.

What's still open is whether Google actually indexes more of the site. Five
of six bill pages sampled from the sitemap were indexed by 9 October, but
member pages are still mostly "crawled – currently not indexed" or unknown,
and that verdict takes weeks. So I've made the crawl better and I don't yet
know if it bought me anything.

## Links

- [Congress For Voters](https://congressforvoters.com), the site this is about
- [Google: Verifying Googlebot and other Google crawlers](https://developers.google.com/search/docs/crawling-indexing/verifying-googlebot)
- [Google: How to consolidate duplicate URLs](https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls), on what a canonical tag does and does not do
- [Google: Introduction to robots.txt](https://developers.google.com/search/docs/crawling-indexing/robots/intro)
- [Google: HTTP status codes and how they affect Google Search](https://developers.google.com/search/docs/crawling-indexing/http-network-errors)
- [An earlier post on the same project](/blog/sparse-ranking-prompt), on making its LLM scoring step cheaper
