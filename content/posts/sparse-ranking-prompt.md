---
schema: 2
title: "The model was writing 108 blank answers per bill and I never looked"
seoTitle: "Making an LLM scoring step cheaper: typesafe.ai's Jev, measured"
date: "2026-09-19"
description: "I tried typesafe.ai's decision model to make an LLM scoring step cheaper. It would have, by a third. The harness I built to test it found the other two-thirds."
tldr:
  - "An AI model scores every bill in Congress on 117 questions for my site, and I wanted that cheaper and faster."
  - "A specialised scoring model from typesafe.ai would have cut the cost by about a third."
  - "Measuring it showed the real waste: the AI wrote out all 117 answers per bill when about 110 were blank."
  - "Asking for only the answers that matter took each bill from 28 s to 4.8 s to score, without a second model."
tags: ["software-engineering", "civic-tech", "llm", "prompting", "ollama"]
accent: "#f59e0b"
draft: false
banner: "A person at a desk late at night with two stacks of paper beside the laptop: a tall, teetering stack of forms where every checkbox is empty, and a short neat stack of a few pages with real writing on them. The laptop shows a bar chart with one bar six times taller than the other. Through the window behind, the Capitol dome is small and distant."
---

I built [Congress For Voters](https://congressforvoters.com). It reads every
bill Congress publishes and scores it against 117 questions - does this cut
taxes for middle-income families, would veterans be better off under this -
so you can see who a bill helps without reading the bill. An LLM does the
scoring. It reads the text and returns a rank from −10 to 10 for each
question with a one-sentence reason.

I spent a week looking at whether [Jev](https://docs.typesafe.ai/introduction),
typesafe.ai's decision model, could do that scoring cheaper. It can. About a
third cheaper, and it did exactly what I asked of it.

Then the harness I'd built to check Jev showed me that my old model was
spending almost all of its output on nothing. Fixing that was worth six times
more than Jev was, and it didn't need Jev at all.

## What the prompt was actually sending

The scoring prompt sent the model a JSON tree of all 117 questions with an
empty answer at every leaf:

```json
{
  "economyAndFinance": {
    "taxes": {
      "reducesMiddleClassTaxes": { "rank": 0, "reason": "" },
      "increasesCorporateTaxes": { "rank": 0, "reason": "" },
      ...
    }
  }
}
```

It asked for the same tree back, filled in. And it got exactly that. All 117
leaves, every time.

The median bill affects nine of them.

So a typical response ran about 10,000 characters, roughly 3,000 output
tokens. About 1,000 characters of that was content. The rest was
`{"rank": 0, "reason": ""}` repeated 108 times.

Output tokens are the slow half of generation. On the local model that does
the backfill - [gemma4 26B](https://ollama.com/library/gemma4), a
mixture-of-experts model served by [ollama](https://ollama.com) on a Mac -
one bill took 17 to 45 seconds, usually about 25. Three to five responses per
hundred came back as malformed JSON, despite three `** VERY IMPORTANT **`
lines in the prompt begging for valid output. A long document is a long
document.

None of this was what I set out to look at. It fell out of measuring
something else.

## The thing I was actually evaluating

[Jev](https://docs.typesafe.ai/introduction) is not an LLM. You send it text
and a batch of typed questions - a Choice over options, a Score over
described levels, a yes/no - and it returns a probability distribution over
your options. Never text. It reads the document once and answers every
question against it in parallel, so 117 questions cost about the same as one.

That shape is close to what my scoring step does, so I wrote a calibration
harness. Ten of the 117 metrics as five-level rubrics, run over 100 bills
that already had stored scores, compared against those.

The levels have to be situations, not numbers. The docs are explicit that the
model doesn't see a level's number or its neighbours:

```ts
{
  key: 'economyAndFinance.budgetAndEconomy.reducesGovernmentSpending',
  instructions: 'What does `bill.text` do to the amount the federal government spends?',
  levels: [
    'The bill would increase federal spending by a large amount, such as a new program or a broad funding increase.',
    'The bill would increase federal spending somewhat, such as a small or narrowly targeted program.',
    'The bill does not change how much the federal government spends, or does not address it at all.',
    'The bill would cut federal spending somewhat, such as trimming or ending a small program.',
    'The bill would cut federal spending by a large amount, such as ending a major program or a broad cut.',
  ],
}
```

100 bills by 10 questions took 26 seconds and $0.018. Jev agreed with my
stored scores on the sign 93% of the time. Its confidence meant something
too: 97% agreement on the 869 pairs it was sure about, 67% on the medium
ones, 43% on the few low ones. That last part is the bit I liked. A model
that knows when it doesn't know is something I can route on.

Reading the disagreements, most were my stored model reaching. An auto-theft
bill scored +1 for consumer protection "because it protects vehicle owners'
property". Jev's literal reading was the more honest one for a voter.

But Jev returns no reason, and the reason is the part I care about most. A
score with no "why" is a number nobody can check. So Jev could only ever be
half a pipeline - Jev for the number, an LLM for the sentence, but only for
the nine metrics that are non-zero rather than all 117. I priced that split
on the same bills. About 35% cheaper and roughly twice as fast.

That's a real win and I would have taken it.

Except the reason the split saved anything was that the LLM half stopped
writing 3,000 tokens of zeros. Which meant the bigger saving didn't need Jev
at all.

## Just stop asking for the zeros

If nothing downstream needed them, the fix was to stop asking.

I checked every reader first. The derivation that writes score rows drops
zeros, the page filters them, and the parser re-densifies a sparse tree onto
the full taxonomy on read. An absent leaf already meant what a zero meant. No
stored data had to change, which was a relief.

The new prompt sent the tree with each leaf's question in place of the empty
template, so there's no form to echo back, and asked for only the metrics the
bill affects.

To measure it honestly the comparison script runs both prompts on the same
100 bills with the same model. It also compares the old prompt against its
own stored output from an earlier run. That's the noise floor - how much one
prompt disagrees with itself.

| same model, 100 bills | avg time | avg chars | avg metrics scored | unparsed |
| --- | --- | --- | --- | --- |
| Original — every one of the 117 | 28.2 s | 11,664 | 6.5 | 3 |
| Hits only | 5.3 s | 1,154 | 4.4 | 0 |

Five times faster, ten times smaller, no parse failures. And a third fewer
metrics scored.

The noise floor was 6.5 against 6.4, so that drop wasn't noise. It was the
prompt.

I read what it dropped. Some was the old model reaching, which I was happy to
lose. Some wasn't. A bill creating firearm-storage penalties lost its −5 on
Second Amendment protections. A pensions bill lost its +7 for seniors. Asked
for only the hits, the model returned a bill's top two or three and stopped.

## Telling it to be thorough did nothing

The obvious fix is to say so. The next version added "consider every one of
the questions in turn, group by group, before you answer; a substantive bill
typically affects between five and fifteen", and tightened the scoring to
direct effects only.

It got worse. 3.6 metrics per bill.

I sat with that for a while. Telling the model to walk the list did not make
it walk the list, and I don't have a tidy explanation for why the instruction
backfired rather than just failing.

## Making it walk

What had made the old prompt thorough was never an instruction. Emitting 117
leaves *was* the walk. The model visited every question because it had to
write something for each one.

So the third version required the walk structurally, at the cheapest level
that still forces a visit. Every domain and every group has to appear in the
answer, in order, with `{}` for a group the bill doesn't touch.

```text
Return a JSON object with every domain and every group from the tree, in the
same order and with the same keys, so that each group is visited. Inside a
group, include ONLY the metrics the bill affects; a group whose metrics the
bill does not affect is an empty object {}.
```

Twenty-four groups is about a kilobyte of skeleton. Here's a whole answer for
a bill about deceptive AI media in elections - 159 output tokens where the
original would have written 3,000:

```json
{
  "economyAndFinance": { "taxes": {}, "jobsAndWages": {}, "budgetAndEconomy": {}, "businessAndTrade": {} },
  "socialIssuesAndJustice": {
    "civilRightsAndEquality": {
      "improvesVotingRights": {
        "rank": 5,
        "reason": "By prohibiting deceptive AI media, the bill helps ensure voters are not misled by fake audio or visual content of candidates."
      }
    }
  },
  "governanceAndIdeology": {
    "governmentIntegrityAndOperations": {
      "improvesElectoralProcess": {
        "rank": 6,
        "reason": "The bill strengthens electoral integrity by creating legal penalties for the distribution of deceptive AI-generated media used to influence elections."
      }
    }
  }
}
```

| same model, 100 bills | avg time | avg chars | avg scored | unparsed |
| --- | --- | --- | --- | --- |
| Original — every one of the 117 | 28.2 s | 11,664 | 6.5 | 3 |
| Hits only | 5.3 s | 1,154 | 4.4 | 0 |
| Hits only, told to be thorough | 2.7 s | 1,000 | 3.6 | 1 |
| Hits only, with the skeleton | 4.8 s | 2,034 | 6.6 | 0 |

The count came back. Six times faster, six times smaller, and not one
malformed response in a hundred.

## What didn't come back

Agreement on the tail. Here's the skeleton version against the old prompt,
with the old prompt's disagreement with itself as the floor:

| of the original's scores at… | the skeleton version keeps (same sign) | noise floor |
| --- | --- | --- |
| any rank | 62% | 86% |
| \|rank\| ≥ 5 | 75% | 92% |
| \|rank\| ≥ 7 | 86% | 95% |

On substance the two agree. A renters' junk-fees bill is +7 for consumer
protection under both, +6/+5 for affordable housing, +7/+7 for low-income
households. Where they differ is the low-magnitude tail, and both tails are
noisy in different ways.

The original's noise was a demographic sweep. A collision-avoidance bill got
eleven groups at +1, and it scored "increases federal power" on 44 of 100
bills, which is a reflex rather than a judgment. The skeleton version has its
own reaches - a fisheries bill at +2 for racial equity, which I can't
account for.

Of eight real scores I tracked that "hits only" had dropped, the skeleton
version brought back four and still misses four. The one that bothers me is a
Caribbean security bill's +6 for international alliances. That's a real
effect and it's gone.

Is 62% tail agreement acceptable? I decided yes, because the floor is 86% and
the disagreements are mostly in scores nobody reads. But I'm aware that's me
grading my own homework.

## What runs now

The skeleton version is what the pipeline runs now, local backfill and
scheduled cloud jobs both, since 2026-09-19. It needed no re-scoring - old
and new responses derive to the same rows, so the change was a prompt and a
comment, not a migration. The first bill scored under it wrote 234 output
tokens.

Jev is parked, and not because it failed. It solved the problem I brought it.
A third off the cost, with a confidence signal I could route on. It's parked
because the harness I built to check it turned up a flaw in my own output
worth twice as much to fix, and fixing that didn't need a second model. The
calibration harness and the ten rubrics stay in the codebase. The day this
project needs a number it can trust more than an LLM's, that's where I'll
start.

The thing I keep coming back to: I'd been running that prompt for months. The
waste was in every response, in plain text, and I never looked at one. I was
only measuring it that week because I was trying to justify a different tool.

## Links

- [Congress For Voters](https://congressforvoters.com), the site whose scoring step this is about
- [typesafe.ai: Introduction to Jev](https://docs.typesafe.ai/introduction) and
  [Jev 1.13 jaggedness](https://docs.typesafe.ai/model-jaggedness/jev-1.13) — the
  honest list of what the model is bad at, which is the best page in the docs
- [typesafe.ai: Score questions](https://docs.typesafe.ai/primitives/score) — why levels are situations, not numbers
- [gemma4 on ollama](https://ollama.com/library/gemma4) — the local model behind the numbers above
- [ollama](https://ollama.com)
