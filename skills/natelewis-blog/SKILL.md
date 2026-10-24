---
name: natelewis-blog
description: Draft, preview, illustrate, and publish a post on natelewis.dev from the current session or a brain dump. Use when the user says /natelewis-blog, "write this up as a blog post", "blog this", wants to publish or backdate a post, or wants to write up a place they ate at (the taco reviews).
---

# natelewis-blog

Turns work, or a night out, into a post on natelewis.dev — from the session you
are in, or from a brain dump the user hands you — and walks it through:
**draft → pictures → safety check → local preview → unlisted draft on the site →
published.**

The blog repo is `~/projects/natelewis-dev` (Next.js, Markdown posts in
`content/posts/`, push to `main` deploys). Read its `README.md` "Writing a
post" section first if anything below seems to disagree with the repo — **the
repo wins.**

**Before drafting any prose, read `VOICE.md` in this skill directory.** It
holds two corpora of Nate's own writing — ~48,000 words of session chat, and
his pre-2026 GitHub PRs and comments, which are the only sample of him
writing for an audience. The first seven posts were written without it and a
reader called them AI slop; the voice section below points at that file, it
does not replace it.

## Arguments

`/natelewis-blog [slug] [key=value ...] [free text]`

- `slug=` — kebab-case; otherwise derive one from the title.
- `date=YYYY-MM-DD` — **backdate**. The date is the published date and
  controls ordering; **older work gets its real date, not today's.**
- `from=<path>` — a notes file or brain dump to draft from instead of the
  session. Free text after the arguments is treated the same way.
- `publish` — flip an existing draft to published (with `date=` if backdating).
- `banner` — regenerate only the banner for `slug=`.

With no arguments and a session behind you: draft from the session.

## What a post is

Run `npm run new-post -- <slug> --title "..." --date ... --tags a,b` to
scaffold. The front matter is fixed. **The body takes the shape the story
has**, and the scaffold asks which one:

- `--shape free` is the default and the norm: front matter, and headings you
  write yourself, as many as the thing needs. **This is where a tech post
  starts too.**
- `--shape walkthrough` is the old five sections — `The problem`, `What I
  tried`, `What happened`, `Where it landed`, `Links`. **Do not use it on a
  new post.** This shape was already documented as the exception and five of
  the first seven posts came out with byte-identical headings anyway, which
  is a large part of why a reader called the site AI slop. It stays in the
  scaffold for the posts that already use it. Write your own headings.
- `--shape review` is somewhere the user went or something they used:
  `kind: review`, a star rating per aspect in place of the TL;DR, the visit in
  whatever headings it wants, then `## The verdict` and `## Where`. See
  *Reviews: tacos, and anything else*.

**There is no short form.** A post is as long as what it has to say: three
paragraphs with a TL;DR on top is a post, and so is three thousand words.
Nothing is too small to publish on its own, and nothing gets padded to earn
the name.

**Problem → what I learned → solution is one shape, not the house style.**
Five of them in a row read like a form being filled in. A post can be a story
told in order, a visit, an argument, a tour of a thing that was built, an
account of what broke on a Tuesday. Nothing downstream cares which: the
contents block, the lists and the feeds are built from whatever headings a
post has, and `check-post` only asks that there are some, that none is empty,
and that a half-used walkthrough is finished or dropped.

Pick the shape after the gathering, from what the material is — not before.
If the draft is fighting its headings, the headings are wrong, not the draft.

## Would a stranger read this?

Before drafting, answer three things in one line each, and keep the answers
at the top of the draft until the post is done (then delete them):

- **Who is it for?** Not "developers". The person who is searching for this
  because they have the problem right now, or the person who would never
  search for it but would be glad to know. Name one.
- **What do they leave with?** The one thing they can *use* — a number, a
  flag, a question to ask first. If the answer is "an account of what I
  did", there is no post yet.
- **What is the turn?** The moment the story changed direction: the guess
  that was wrong, the fix set aside that turned out to be the big one, the
  tool that solved the problem and got parked anyway. A post with no turn is
  a changelog. **If there is no turn, say so and ask the user** whether the
  one finding is worth a few hundred words on its own — a short post is still
  a post — or whether this one gets left alone. A post that is not about work — a place, a
  night, a thing that happened — needs a moment worth retelling rather than a
  turn: the wave-off at the counter, the thing nobody orders. Same question,
  less formality.

Those three become the `tldr` and the opening. **The turn goes in the first
two paragraphs, not paragraph eleven**: the reader decides whether to stay
before the first `##`, so the surprise cannot wait for *What happened*. The
template's sections carry the evidence; the opening carries the reason to
read them. Concretely:

- **The best sentence in the post goes above the first `##`.** Find it after
  drafting (it is usually in *What I tried* or *Where it landed*, the line
  that reframes the thing) and put a version of it in the opening. Leaving
  it in place for the body is fine; repeating it is not the problem, burying
  it is.
- **No link dumps in the opening.** One or two links at most before the
  first `##`; every repo, doc and tool gets its link where it is first used
  in the body, and all of them again under `## Links`. An opening with four
  links and two dates in it is a bibliography, and the reader has not been
  given a reason to care yet.
- **If the post is a how-to with no surprise, name what was not obvious.**
  Even a routine build has two things that were not routine; say what they
  were in the opening, so the reader who already knows the routine has a
  reason to keep going.

Before the preview, read it once as the person named above. Where would
they stop reading? That paragraph is where the post gets cut or moved.

## The voice

**Read `VOICE.md` in this skill directory before drafting, every time.** It
holds Nate's session chat and his pre-2026 GitHub writing, measured and
excerpted, and it is the reference. The GitHub samples matter most: they are
him writing for other people, which is what a post is. The notes below are what the samples mean in practice; when
they disagree with the samples, the samples win.

A reader's verdict on the first seven posts: *wasn't enjoyable to read, felt
like it was just AI slop, didn't sound like you wrote it.* They were right,
and the cause was this section: a long list of prohibitions produced prose
with every tell sanded off and nobody inside it. **Clean is not the goal.**

First person, past tense, plain. It walks through what was tried and what
came of it, and **it says when the outcome was bad or still open**: a post
that only reports wins is not this blog. **Numbers beat adjectives** — "5.3 s
vs 28 s" not "much faster". Session labels stay in the session: no
"V1"/"V2c", branch names or ticket ids — name a variant by what it does
("hits only, with the skeleton") and use the same name in every table and
sentence.

**Match his rhythm, which the first seven posts did not.** His median
sentence is 7 words; theirs were 20–35, and every one the same length. Write
short, vary hard, let a long sentence happen when something is being worked
out. If a paragraph's sentences are all one length, rewrite it.

**Leave the uncertainty in, in the present tense.** He writes "I'm not sure
what to do with them", "am I not thinking of this correctly?", "that might
have changed I'm not sure though". The old posts resolved everything before
the reader arrived and filed the leftovers under a tidy `Open:` line at the
end. Say it where it happens instead. A post may end on a question.

**Judge the thing as its reader.** Somewhere in every post, look at the work
from the position of the person receiving it, not the person who built it —
"as a reader, I was giving 3 pages of text", "still not sure how to digest
that".

**Say the blunt thing, and the enthusiastic one.** "MASSIVE", "big walls of
text", "it still has a code smell", "this is getting much better", "would be
pretty cool". The old posts had no opinion and no pulse. Both are allowed.

**Agent-forward, engineer-led.** The work on this blog is done with AI
agents, and the posts say so plainly — what was asked of the agent, what it
came back with, where it was wrong and how that was caught. It is never vibe
coding: the agent is a tool the author directs, and the principles are the
author's — measure before changing, know the machine, keep the tests honest,
distrust a number you cannot reproduce. Write the agent's part
matter-of-factly, as a colleague's ("I had the agent pull the step timings
before either of us read any code") — not as magic, not as the hero, and
**never by comparison to a less experienced person** ("like a junior", "like
an intern").

**Experience shows in the questions, never in the telling.** Show it by doing
it: "the first question was where the eight minutes went", never "an
experienced engineer would ask where the eight minutes went". **No lines that
rank the author** — no "experienced engineers know", "you learn to", "the
engineering was in". If a sentence would read as a flex to someone junior,
cut it or turn it into the plain step it describes.

### The tells that got the site called slop

Check for these before the preview. They are what the corpus says he does
*not* do, not a general list of bad writing:

- **The balanced two-beat fragment.** "It is not a comeback. It reads like
  one." / "Kitchen is where, not what." / "Not because I chose to. There was
  nothing else to put there." Five of these across two posts. This is the
  single most recognizable model cadence in English. One per post is one too
  many.
- **Bolding as punctuation.** One post had 27 bolded phrases. See *Bolding*
  below.
- **Em dashes.** He uses 24 in 48,000 words, and a spaced hyphen nine times
  as often. A handful a post at most.
- **Uniform paragraphs.** Four to six lines, every time, is a tell by itself.
- **Perfection.** Real work has a loose end, a number that was not taken, a
  step done in the wrong order. Keep them in. A table where every row
  improved by a tidy ratio and a narrative where every guess was right are
  the tells.
- **Slogans.** If it would fit on a t-shirt, cut it and write the plain thing
  instead: "with the sauce on it, the taco was perfect".
- **Vocabulary.** No "delve", "crucial", "robust", "seamless", "leverage",
  "it's worth noting", "the kind of thing"; no "simply"/"plainly"/"exactly"
  as intensifiers; no "the interesting part is". Say the thing.

**It happened is not a reason it is in the post.** Tests passed, CI took
seven minutes, a merge waited on branch protection — real work, wrong
document. A finding stays only if it changes what the reader would do, or is
the turn. *But do not use this to cut the person out of the post.* Why it
mattered, what it cost, who was waiting, what it felt like to find — that is
not session diary, that is the post. The old rule said "would it be at home
in the pull request's description instead?", and the posts came out reading
like pull request descriptions.

**The project is background, not subject.** Say what kind of project it is
only as far as the problem needs it; a reader with a different project should
never have to translate.

### Bolding

**Bold almost nothing.** At most one phrase in a post, and most posts have
none. The previous rule here asked for a bolded takeaway in every section;
the result was 21 and 27 bolded phrases in single posts, a reader elbowed
every three paragraphs, and the loudest machine-written signal on the site.
If a sentence needs bold to be noticed, it is in the wrong place in the
paragraph.

Front matter (`schema: 2`):

| field | rule |
| --- | --- |
| `kind` | `post` (default) or `review` (see *Reviews*) |
| `title` | a claim or a question, not a topic ("The model was echoing 108 empty leaves", not "Ranking prompt update") |
| `date` | ISO; the published date; backdate with `date=` |
| `updated` | ISO; only when a published post is materially revised |
| `description` | one sentence, ≤160 chars; the list, RSS and `<meta>` show it |
| `rating` | **a review's scorecard, required on one, and not used anywhere else.** A list of `{aspect, stars, note}`: 3–6 parts of the thing, stars out of five in halves, a few words each. The overall is their mean and is not a field. |
| `reviewOf` / `reviewOfType` / `reviewOfUrl` | what a review is of: the name, a schema.org type (`Restaurant`, `LocalBusiness`, `Product`, `Book`…), its own site. They become the review's structured data. |
| `tldr` | **3–4 bullets, one line each, required on a post** (a review has a scorecard instead). Rendered in a box under the title and used as the article's abstract for search. **It must make sense to someone who reads only the box**; see *The TL;DR* below. Under ~130 characters a bullet. Written *last*, from the finished post. `check-post` errors when it is missing and warns past 4 bullets or 130 chars. |
| `tags` | lowercase kebab-case. **Reuse existing tags first** — `grep -h '^tags:' content/posts/*.md` shows the vocabulary. Add a new tag only when no existing one fits, and say so. |
| `accent` | a hex colour; pick one that suits the banner |
| `draft` | `true` until the user says publish |
| `banner` | the *scene* for a generated image, one or two sentences, concrete (what is in frame, what is happening). No style words — the style lives in `scripts/banner.mjs` so every banner matches. A post illustrated with photographs has no scene and leaves this out. |
| `imageCredit` | whose photographs these are, when they are not generated: "Photographs: Mexica Burrito Grill". Renders under the banner. |
| `imageCreditUrl` | where they came from; makes the credit a link. |

## The TL;DR

**A review has no TL;DR** — its scorecard does this job, and the rules below
do not apply to it. For everything else:

The box is read *before* the post, often instead of it, by someone who
does not yet know the project, the problem or the words the post defines.
A reader once said of a published TL;DR that it "didn't make sense": every
bullet was accurate, and every one leaned on the post to explain it. So:

- **Bullet one says what the post is about, in plain words**: the
  situation and what was wrong, as you would tell a friend who asked
  "what did you write about?" No numbers needed here; context is.
- **Each bullet is a whole sentence that stands on its own.** No list of
  shorthand ("count, distinct pages, query strings, p90"), no term the
  body introduces ("the skeleton", "tiny 200s", "the harness", "the
  loop"), no "it" or "that" pointing at a previous bullet's noun.
- **Gloss or drop every term of art.** "CI" becomes "the automated test
  run (CI)" or goes; "p90" becomes "the slowest pages"; a tool or model
  name gets three words saying what it is. If it cannot be glossed in a
  few words, the bullet is about the wrong thing.
- **A number says what it measures**: "each bill went from 28 s to 4.8 s
  to score", not "28 s → 4.8 s".
- **Order: situation → what turned out to be wrong → the fix and its
  result → what to take away** (or what is still open).

The test before saving: read the bullets aloud to someone who has not
seen the post. If they cannot say back what it is about and what
happened, rewrite. Accurate and opaque is still a failure.

## Reviews: tacos, and anything else

A review is somewhere the user went or something they used, **scored out of
five on the parts that mattered.** The running series is tacos — the blog is
mostly code and this is the other half of it, and the taco in the header is
the `tacos` topic glyph — but the shape is the same for a tool, a guitar
pedal, a pair of headphones or a hotel. Reviews list on `/reviews` and are
labelled in every list.

- **Scaffold with `--shape review`**, which writes `kind: review` and the
  `rating:` block. The middle is whatever the visit was; `## The verdict` and
  `## Where` close every one of them, in that order, so the series reads the
  same way from post to post. For a thing rather than a place, `## Where` is
  where to get it and what it cost.
- **No TL;DR on a review.** The scorecard does that job — see *The scorecard*
  below. `check-post` asks for the rating instead of the bullets.
- **Title: `<Place>, <Town>: <the claim>`.** "Mexica Burrito Grill, Billerica:
  real tacos in an old Dunkin'". The name and the town are what somebody
  searches; the claim is why they would read it.
- **Tags** for a taco review: `tacos`, `food`, and the area —
  `greater-boston`. Those are a topic in `src/lib/topics.ts`, so a new area
  tag goes in that list too, or the header glyph will not light. A review of
  something else takes the tags that thing would take.
- **`## Where` is not optional**: street address, town, state and ZIP, the
  hours *as of writing* (say so), other locations of the same place, and a
  link to their own site. `check-post` warns when a review has no
  `## The verdict` or no `## Where`.
- **Only what happened.** No invented dishes, prices, drive times, decor or
  staff. If it was not in the brain dump and is not on the restaurant's own
  site, it does not go in the post. Where the user's spelling of a place or
  town differs from the sign, use the sign.
- **Say the parts that were not great**, and what is still untried — the
  second location, the thing on the menu nobody orders. An all-praise review
  is an ad. The enthusiasm is the user's and it carries; the post does not
  need to sell.
- The voice rules below hold, with one easing: a review is allowed more
  colour than a work post, because the scene *is* the evidence. It still gets
  cut when a sentence only sets a mood.

### The scorecard

```yaml
rating:
  - aspect: "The tacos"
    stars: 4.5
    note: "Flour, ground beef with real seasoning in it"
```

- **Three to six aspects**, named for *this* thing in the post's own words —
  "The salsa", "Ordering", "The room", "Going back". **Not a fixed rubric**
  reused across every review; the parts that mattered here are the parts that
  get scored. A last aspect about coming back or buying it again is the one
  habit worth keeping.
- **Stars are halves**, 0 to 5. The overall is the mean of the rows,
  calculated at render time — **never write an overall into the front
  matter**, and never tune an aspect to make the average come out nicer.
- **A `note` of a few words** per row, under ~70 characters, saying what the
  score is for. The row is read on its own by someone skimming.
- **The scores are the user's opinion, not yours.** Derive them from what they
  actually said — "really good but needed a little extra" is not five stars —
  and when the brain dump does not say, put the numbers in the draft, say they
  are your read of their notes, and let them correct. Never invent an aspect
  they never mentioned.
- `reviewOf`, `reviewOfType` and `reviewOfUrl` name the thing for the
  structured data: a `Review` with the overall as `ratingValue` goes out
  alongside the usual `BlogPosting`.

### The pictures

**A review is illustrated the way every other post is**: a scene in the front
matter and `npm run banner -- <slug>`, drawn in the house style with the
recurring character. **The restaurant's own photographs do not go on the
site.** Their marketing shots are their marketing, and a page of them stops
looking like this blog.

**Glean the scene from the post.** Everything needed is already in the brain
dump: the building it used to be, the lane curving around the side, the
counter the plate slides down, the little cup of sauce. Make one frame out of
those — the thing a reader would recognise if they drove past it.

- Lead with the **place, not the plate**. A drawn taco is a generic taco; the
  story is the building with its past showing through.
- Name the giveaways without naming the brand: "a band of faded pink and
  orange under the fresh paint", "a drive-through lane curving round to a
  service window", "a squat flat roof with a wide canopy". **No signage,
  logos or lettering** — the house style keeps text out of the image, and a
  real chain's mark is not ours to draw.
- Put the character in it with the taco and the cup, usually small in the
  frame and walking toward the door.
- A detail from the post earns its place over a detail from stock imagery:
  the lit interior full of seats, because the post says there is room.
- Same rules as any banner: the scene lives in `banner:`, no style words,
  regenerate rather than hand-edit. If `--prompt` is used to try a variant,
  **copy the winning prompt back into `banner:`**, or the post can no longer
  be rebuilt.

`npm run photo` exists for photographs the user took themselves — it builds
the same files from a path or URL and records the sources in
`public/posts/<slug>/photos.json`. Anything that is not the user's own picture
needs `imageCredit`/`imageCreditUrl`, and the simpler answer is not to use
someone else's at all.

## Code snippets

Every post has code, and **every snippet must be safe to publish.** Before a
snippet goes in:

- **Projects are anonymous unless the user has said one is public.** Refer
  to unreleased work generically — "a side project that scores federal
  legislation" — and keep its name, URL, repo and any "production" claim
  out of the post and the tags. The goal and the problem stay; the pointer
  goes. Ask if unsure whether a project is public.
- No keys, tokens, hostnames, bucket names, project IDs, internal URLs,
  emails, home paths, or customer/user data. Replace with `***` or a
  placeholder and say it is a placeholder.
- Show the shape of the thing, not the whole file: the ten lines that carry
  the idea, with a one-line comment naming what was cut.
- **It must be relevant** — a reader should need it to understand what was
  done. Output tables and log lines count as snippets and get the same
  treatment.
- Prefer code from a public repo and link to it (`## Links`) over pasting.

`npm run check-post -- <slug>` scans for the accidental leaks; **it does not
judge substance. Read the post once as a stranger before pushing it.**

## Links

Link out wherever a reader would want to go next: the docs page that was
read, the tool's site, the API reference, the paper, the public repo, the
prior post here. Inline where first mentioned, and collected under
`## Links` at the end. An empty `## Links` is a warning from `check-post`.

## The steps

1. **Gather.** From the session: what was the goal, what got in the way,
   each attempt with its result, the numbers, and where it landed. From a
   brain dump: read it, then ask at most two questions if the outcome or the
   numbers are missing — **a post without them is a list.** Answer the three
   questions under *Would a stranger read this?*; if there is no turn, stop
   and ask. Note the dates: a session that spanned days may want `date=` set
   to when the work happened. From a visit: what was ordered, how it tasted,
   the moment worth retelling, and whether they would go back — then read the
   place's own site for the address, the hours and the other locations rather
   than writing them from memory, and work out which three to six parts of it
   are worth scoring.
2. **Scaffold and draft.** Pick the shape from the material (*What a post
   is*), `npm run new-post -- <slug> --shape <shape> ...`, then write it.
   Remove the `<!-- -->` prompts. Write the `tldr` and the `banner` scene
   last: the bullets from the finished post, the scene from its strongest
   image.
3. **Banner.** Every post gets one, reviews included — for a review the scene
   comes from the place itself, see *Reviews: tacos, and anything else*.
   `npm run banner -- <slug>` (needs `GEMINI_API_KEY` in
   `.env.local`). Look at `public/posts/<slug>/banner.webp`. **The
   character always wears a hat** (bucket hat, ball cap, beanie — whatever
   suits the scene); that rule is in `STYLE`, not in the scene, so if a
   banner comes back bare-headed, re-run rather than adding "hat" to the
   scene. A scene may name *which* hat when it matters. If it is
   wrong, rewrite the scene in front matter and re-run — **do not add style
   words to the scene.** Two tries is usually enough; a third is a different
   scene.
4. **Check.** `npm run check-post -- <slug>`. **Fix every ERROR.** Read each
   WARNING and either fix it or say why it stands.
5. **Preview locally.** The session is usually in another project, so
   `preview_start {name}` cannot see the blog's launch config. Start the
   server where the user can see it — `run_in_terminal` with
   `cd ~/projects/natelewis-dev && npm run dev` (if one is already on :3000
   it says so; reuse it) — then `preview_start {url: "http://localhost:3000/blog/<slug>"}`.
   Also look at `/blog` for the thumbnail and tags in the list (drafts are
   listed in dev). Screenshot for the user. **Iterate on the post with them
   here until they are happy — this is where the tweaking happens.**
6. **Draft on the site — only when the user says so.** Every push to
   `main` deploys, so iterating happens locally (step 5) and **nothing is
   pushed until the user asks for the draft link.** With `draft: true`, commit on a branch named
   `post/<slug>`, push, open a PR, and merge (CI is lint + build). The deploy
   runs from `main`; the URL `<site>/blog/<slug>` works for anyone who has
   it but appears in no listing, feed or sitemap, and carries `noindex`.
   `<site>` is `site.url` in `src/lib/site.ts` once the domain resolves;
   until then it is the Cloud Run URL from
   `gcloud run services list --project natelewis-dev --format='value(URL)'`.
   Check with `curl` that the page is 200 and that `/blog`, `/rss.xml` and
   `/sitemap.xml` do not mention the slug, then give the user the link.
7. **Publish.** **When told**: set `draft: false`, set `date=` if backdating (or
   leave the date the draft had), run `check-post` once more, commit and
   merge. Say the post is live and at which URL, and which tag pages it
   joined.

Commit messages are plain: `post: <title>` for a new draft,
`post: publish <slug>` to publish, `post: <slug> — <what changed>` for a
revision. **No attribution trailers.**

## Do not

- Do not write in the third person or in marketing voice.
- Do not invent numbers or outcomes; if the session did not measure it,
  the post says it was not measured.
- Do not publish (`draft: false`) without being told to.
- Do not put style words in `banner`; do not hand-edit or hand-crop any
  image — change the scene and regenerate, so the pictures stay reproducible.
  Do not leave a `--prompt` variant on disk without copying it into `banner:`.
- Do not illustrate a post with pictures taken from someone else's site.
- Do not furnish a place with details nobody gave you. A review says what the
  user saw and what the restaurant publishes, and nothing else.
- Do not add front matter fields the schema does not have; propose the
  field, and bump `SCHEMA_VERSION` in `src/lib/posts.ts` if it changes the
  meaning of an existing one.
