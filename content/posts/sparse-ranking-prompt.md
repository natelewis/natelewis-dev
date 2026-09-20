---
schema: 1
title: "Jev from typesafe.ai fixed 30% of my problem. Measuring it fixed the rest."
date: "2026-09-19"
description: "I tried typesafe.ai's decision model to make an LLM scoring step cheaper. It would have, by a third. The harness I built to test it found the other two-thirds."
tags: ["civic-tech", "llm", "prompting", "ollama"]
accent: "#f59e0b"
draft: false
banner: "A person at a desk late at night with two stacks of paper beside the laptop: a tall, teetering stack of forms where every checkbox is empty, and a short neat stack of a few pages with real writing on them. The laptop shows a bar chart with one bar six times taller than the other. Through the window behind, the Capitol dome is small and distant."
---

I have a side project that reads every bill Congress publishes and scores it
against 117 questions — "does this cut taxes for middle-income families?",
"would veterans be better off under this?" — so that a voter could see who a
bill helps and what it costs without reading the bill. An LLM does the scoring:
it reads the text and returns a rank from −10 to 10 for each question, with a
one-sentence reason.

I went into this week wanting to know whether [Jev](https://docs.typesafe.ai/introduction),
typesafe.ai's decision model — not an LLM — could do that scoring cheaper. It
could, by about a third, and it did exactly what I asked of it. But **the
measurement I built to evaluate it showed the old model was spending almost all
of its output on nothing**, and fixing *that* was worth six times more than Jev
was. Without Jev.

## The problem

The scoring prompt sent the model a JSON tree of all 117 questions with an empty
answer at every leaf:

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

and asked for the same tree back, filled in. It got exactly that: all 117
leaves, every time. But **the median bill affects nine of them.** So a typical
response was ~10,000 characters — about 3,000 output tokens — of which ~1,000
characters were content and **the rest was `{"rank": 0, "reason": ""}` repeated
108 times.**

Output tokens are the slow half of generation. On the local model that does the
backfill ([gemma4 26B](https://ollama.com/library/gemma4), a mixture-of-experts
model served by [ollama](https://ollama.com) on a Mac), one bill took 17–45
seconds, typically about 25. Three to five responses per hundred came back as
malformed JSON, despite three `** VERY IMPORTANT **` lines in the prompt begging
for validity — a long document is a long document.

None of that was the thing I set out to look at. It just fell out of measuring
something else.

## What I tried

### A decision model instead of a generative one

The thing I was actually evaluating was [Jev](https://docs.typesafe.ai/introduction),
from typesafe.ai. It is not an LLM. You send it a piece of text and a batch of
typed questions — a *Choice* over options, a *Score* over described levels, a
yes/no — and it returns a probability distribution over your options, never
text. It ingests the document once and answers every question against it in
parallel, so **117 questions cost about the same as one.**

That shape is close to what the scoring step does, so I wrote a calibration
harness: ten of the 117 metrics as five-level rubrics, run over 100 bills that
already had stored scores, and compared. The levels have to be *situations*,
not numbers — the docs are explicit that "the model doesn't see a level's number
or its neighbours":

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

100 bills × 10 questions took **26 seconds and $0.018**. Jev agreed with the
stored scores on the sign **93% of the time**, and **its confidence meant something**:
97% agreement on the 869 pairs it was sure about, 67% on the medium ones, 43%
on the few low ones. Reading the disagreements, most were the *stored* model
reaching — an auto-theft bill scored +1 for consumer protection "because it
protects vehicle owners' property" — and Jev's literal reading was the more
honest one for a voter.

But **Jev returns no reason**, and the reason is the part I care about most. A score
with no "why" is a number nobody can check. So it could only ever be half of a
pipeline: Jev for the number, an LLM for the sentence — but only for the nine
metrics that are non-zero, not all 117. I priced that split on the same bills:
**about 35% cheaper and roughly twice as fast.** A real win, and I would have taken it.

Except the reason the split saved anything was that the LLM half stopped writing
3,000 tokens of zeros. Which meant **the bigger saving did not need Jev at all.**

### Sparse output: only return what you scored

If nothing downstream needed the zeros, the fix was to stop asking for them. I
checked every reader — the derivation that writes score rows drops zeros, the
page filters them, and the parser re-densifies a sparse tree onto the full
taxonomy on read — so an absent leaf already meant what a zero meant. No stored
data had to change.

The new prompt sent the tree with each leaf's *question* in place of the empty
template (no form to echo back), and asked for only the metrics the bill
affects. To measure it honestly, the comparison script runs both prompts on the
same 100 bills with the same model, and also compares the old prompt against its
own stored output from an earlier run — that is the noise floor, what one
prompt disagrees with itself by.

| same model, 100 bills | avg time | avg chars | avg metrics scored | unparsed |
| --- | --- | --- | --- | --- |
| Original — every one of the 117 | 28.2 s | 11,664 | 6.5 | 3 |
| Hits only | **5.3 s** | **1,154** | **4.4** | 0 |

Five times faster, ten times smaller, no parse failures — **and a third fewer
metrics scored.** The noise floor was 6.5 vs 6.4, so that drop was the prompt.
Reading what it dropped: some was the old model's reaching, but some was real
and important — a bill creating firearm-storage penalties lost its −5 on
Second Amendment protections; a pensions bill lost its +7 for seniors. Asked for
only the hits, **the model returned a bill's top two or three and stopped.**

### Telling it to walk

The obvious fix: say so. The next version added "consider every one of the questions in turn,
group by group, before you answer; a substantive bill typically affects between
five and fifteen," and tightened the scoring to direct effects only.

It got worse: 3.6 metrics per bill. **Telling the model to walk the list did not
make it walk the list.**

### Making it walk

What had made the old prompt thorough was not an instruction. **Emitting 117
leaves *was* the walk** — the model visited every question because it had to write
something for each one. So the third version required the walk structurally, at the cheapest
level that still forces a visit: every domain and every group has to appear in
the answer, in order, with `{}` for a group nothing in the bill touches.

```text
Return a JSON object with every domain and every group from the tree, in the
same order and with the same keys, so that each group is visited. Inside a
group, include ONLY the metrics the bill affects; a group whose metrics the
bill does not affect is an empty object {}.
```

Twenty-four groups is about a kilobyte of skeleton. Here is the whole answer for
a bill about deceptive AI media in elections, 159 output tokens where the original would
have written 3,000:

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

## What happened

| same model, 100 bills | avg time | avg chars | avg scored | unparsed |
| --- | --- | --- | --- | --- |
| Original — every one of the 117 | 28.2 s | 11,664 | 6.5 | 3 |
| Hits only | 5.3 s | 1,154 | 4.4 | 0 |
| Hits only, told to be thorough | 2.7 s | 1,000 | 3.6 | 1 |
| **Hits only, with the skeleton** | **4.8 s** | **2,034** | **6.6** | **0** |

The count came back. **Six times faster, six times smaller, and no malformed
responses in a hundred.**

What did *not* come back is agreement on the tail. Against the old prompt, with
the old prompt's disagreement with itself as the floor:

| of the original's scores at… | the skeleton version keeps (same sign) | noise floor |
| --- | --- | --- |
| any rank | 62% | 86% |
| \|rank\| ≥ 5 | 75% | 92% |
| \|rank\| ≥ 7 | 86% | 95% |

**On every bill's substance the two agree** — a renters' junk-fees bill is +7 for
consumer protection under both, +6/+5 for affordable housing, +7/+7 for
low-income households. They differ in the low-magnitude tail, and both tails are
noisy in different ways. The original's was a demographic sweep: a
collision-avoidance bill got eleven groups at +1, and it scored "increases
federal power" on 44 of 100 bills, which is a reflex, not a judgment. The
skeleton version has its own reaches (a
fisheries bill at +2 for racial equity). Of eight real scores I tracked that
"hits only" had dropped, the skeleton version brought back four and still misses
four. One that bothers
me: a Caribbean security bill's +6 for international alliances.

## Where it landed

The skeleton version is what the pipeline runs now, for both the local backfill and the
scheduled cloud jobs, since 2026-09-19. It needed no re-scoring: old and new
responses derive to the same rows, so the change was a prompt and a comment,
not a migration. The first bill scored under it wrote 234 output tokens.

Jev is parked, and not because it failed. It solved the problem I brought it —
a third off the cost of a scoring step, with a confidence signal I could route
on. It is parked because the harness I built to *check* it turned up a flaw in
my own output that was worth twice as much to fix, and fixing that did not
need a second model. The calibration harness and the ten rubrics stay in the
codebase; the day the project needs a number it can trust *more* than an LLM's, that
is where I will start.

What I would tell someone doing this: **measure the output before you optimise
the model**, and when a model is being lazy, do not tell it to be thorough —
**change the shape of the answer so that thoroughness is the only way to produce
it.**

## Links

- [typesafe.ai: Introduction to Jev](https://docs.typesafe.ai/introduction) and
  [Jev 1.13 jaggedness](https://docs.typesafe.ai/model-jaggedness/jev-1.13) — the
  honest list of what the model is bad at, which is the best page in the docs
- [typesafe.ai: Score questions](https://docs.typesafe.ai/primitives/score) — why levels are situations, not numbers
- [gemma4 on ollama](https://ollama.com/library/gemma4) — the local model behind the numbers above
- [ollama](https://ollama.com)
