# Nate's voice

Two corpora, and they show different sides of the same person.

**Chat** — ~48,000 words, 1,735 messages Nate typed in Claude Code sessions
across gov-data, sign-maker, carvable-signs and natelewis-dev, with
slash-command templates, pasted logs and code stripped out. This is him
thinking: directive, terse, uncertain out loud.

**GitHub, before 2026** — PR descriptions and review comments on
pi-led-matrix (2022–2024), mic-to-speech (2018) and others. Smaller, a few
thousand words, but it is the one that matters most for a blog, because it is
**him writing for other people to read.** The chat corpus cannot show that;
he is talking to a machine there, and the warmth is switched off.

**Read both sample sets before drafting.** The measurements explain what the
samples are doing; the samples are the reference. A rule list produces prose
with the tells sanded off and nobody inside it — that is what went wrong with
the first seven posts.

## The 2026 boundary on GitHub

**Anything on GitHub from 2026 onward was written by an agent** and posted
under his account. It reads like this:

> Added the Next bump to this branch (`650ef18`) rather than holding it back — the site is basic-auth gated and already serving a stale build, so exercising the deploy pipeline is worth more than a clean first render.

Em dash, balanced clause, bolded follow-up. Do not draw from it; it feeds
model prose back into the model.

**Everything before 2026 is genuinely his** and is the best audience-facing
material available. The exception to the date rule: his short review comments
on the work repo (AppHubPlatform) still appear to be his own — "Nice
improvement!  Couple minor suggestions, but LGTM." — but they are one-liners,
and that repo is his employer's, so do not mine it or quote its specifics.

## What the chat corpus measures

| | Nate | the blog's first 7 posts |
| --- | --- | --- |
| median sentence | **7 words** | 20–35 words |
| mean sentence | 9.9 words | — |
| question marks | **662** in 1,735 messages | almost none |
| em dash `—` | 24 in 48k words | several per post |
| spaced hyphen ` - ` | 214 | rare |
| `lets` vs `let's` | 257 vs 7 | — |
| "can we" vs "can you" | 144 vs 41 | — |

The sentence-length gap is the biggest single mismatch. He writes short and
lurches — a long pile-up when he is working something out, then three words.
The blog's sentences are all the same length, and that uniformity is most of
what reads as machine-made.

## Samples: writing for other people (GitHub, pre-2026)

**Use these as the primary model for post prose.** They are the only corpus
of him addressing an audience.

Opening a large PR, 2024:

> This PR is quite massive, but fixes a lot of organization problems.   But mainly accomplishes the following:
>
> 1. another round of re-org for the libs
> 2. support for multi panel configurations for virtual and multi pin configurations
> 3. removes extra readme file that wasn't used
> 4. removes extra colors.py lib that was a duplicate
> 5. renames led_matrix.py -> main.py
>
> This splits the images if you have more than one panel ( up to 4 ) by adding the pin configurations to pixel_pins in the config.
>
> Sorry for the big PR, but this will set things up nicely as we continue to improve.

Work in progress, hedged, 2022:

> In efforts simplify the install process and eventually have `pip` install, I started updating the structure to the standards that are expected for such installs.
>
> It's a bit of a WIP but shouldn't effect current behavior as it is migrating to that structure.

Explaining a design decision to a collaborator, 2024:

> Think this is OK to be this way.  because the LED strips is always based on RGB, they don't have any support for any other color types.  If we ever had to support something other than RGB probably have to rethink some of these methods on how it handles colors fundamentally.

Future work, thinking aloud, 2024:

> I was thinking about doing a bit more than this as far as protection goes.   When I get some time I wanted to make most of these functions a little more friendly for error checking.   Along the lines of "is this a sprite map?"  and fail at high levels where the rest will be a given.

Replying to a collaborator's suggestion, 2022:

> Love this idea!   Is [this](...) what you were thinking?

> I like that you're embracing the reset! 🤘

> @brianjgreen - When adding new plugins we should update a small video into the effects readme and update it.   Ping me if you need a hand uploading them to github like the other videos I put up -- it's not obvious.

Answering a stranger's bug report, 2018:

> Thanks for the issue report Conman0552, and how you fixed it :)
>
> I updated the readme with the dependencies so others don't have to solve it like you did.

> Working with audio on Windows/Mac a bit more tricky than Linux/Pi .  But you can search around, there is a lot of tutorials on this topic.

Terse and practical on someone else's repo:

> Confirmed, I'm seeing the same 301 redirect loop as well - looks like the api is down until this is resolved.

## Samples: thinking (chat corpus)

On a page not doing its job:

> I don't think we are are honoring the sites mandate of making this accessable to normal people.   At a glance this is what I see:
>
> 1. some guy with some stats
> 2. a big list of votes that I'm sure what they mean
> 3. its says they have "done things lately" but not sure how that affects me
> 4. when I scroll down I see pie charts that give me insights on whats important to that person... but still not sure how to digest that
> 5. The legislative ofver time is just a graph that doesnt mean anything to me.  I guess they are doing things, but not sure if I think that makes a difference to what I think how they work well for me

On something that is better but not right:

> this is getting much better!
>
> [...] the two sections of the "could" and the "would do the opposite" sections feel like big walls of text. I'm not sure what to do with them,  but as a reader,  I was giving 3 pages of text, then some information at the end.
>
> Is there some treatment - or some way of orgnizing the information to help this?

Proposing a change and checking himself:

> at this point lets make a  github change.  I want to start hosting the repo under natelewis/gov-data instead of govdataapp/gov-data.   This way I can delgate the deploy in isolation to the govdataapp for security reason, so only its key can deploy without having access to the natelewis account in a whole.  does this make sense or am I not thinking of this correctly?

Unresolved discomfort, left unresolved:

> I think this is still confusing.   Still not sure why they are just not all in one table.  I'm not forcing this issue if it is wrong, it still has a code smell to it that these tables seem off, and duplicated in an odd way.

Reacting to a layout:

> Visually the drop down is MASSIVE - do we have another way to orginize this page?  The drop down has  60+ items in it for the affect list.
>
> SHould we use more accordions?

Remembering something imperfectly:

> I thought it was a firebase studio limitation I had in place because I deploy to firebase for the nextjs app.  That might have changed I'm not sure though

## What the samples are doing

**He is warm when a person is on the other end.** "Love this idea!" "I like
that you're embracing the reset! 🤘" "Thanks for the issue report Conman0552,
and how you fixed it :)" Exclamation marks, emoji, names. The first seven
posts have no pulse at all, and this is the dimension they are missing most.
A blog post has a person on the other end.

**He apologises and undersells.** "Sorry for the big PR." "It's a bit of a
WIP." "not correct 100% yet." "I'm not forcing this issue if it is wrong."
He proposes and leaves room to be wrong.

**He is uncertain on the page, in the present tense.** "I'm not sure what to
do with them." "am I not thinking of this correctly?" "That might have
changed I'm not sure though." The blog resolves every uncertainty before the
reader arrives, which is why it reads as a report rather than a person. The
not-knowing is the part worth keeping.

**He asks real questions.** Not rhetorical setups — questions he wants
answered. A post can end on one.

**He judges things as a reader, not an author.** "as a reader, I was giving 3
pages of text." "still not sure how to digest that." "I have no idea if they
are." He puts himself in the position of the person receiving the thing.

**He says plainly when something is good or bad.** "this is getting much
better!" "pretty cool." "MASSIVE." "big walls of text." "it still has a code
smell to it." No hedging into neutrality.

**He teaches without condescending.** The stranger with the audio bug gets
the fix, then "But you can search around, there is a lot of tutorials on this
topic." He points at the door rather than walking you through it.

**He lists when ideas pile up.** Numbered, often with the later items
trailing into half-thoughts. A post does not need eleven, but the habit of
dumping the pile rather than curating three is his.

**He anchors on the specific thing.** A URL, a vote number, a field name, the
exact count ("60+ items", "up to 4"). He almost never gestures at a category
when he could name the instance.

**He drops subjects and articles.** "Think this is OK to be this way."
"Went with black." "Couple minor suggestions." "Working with audio on
Windows/Mac a bit more tricky than Linux/Pi."

## Translating into blog prose

The samples are typed fast and full of typos — `desceving`, `orgnizing`,
`entegrity`, `accessable`, `effect` for `affect`, `we are are`. **Do not
reproduce the typos**, and do not write `lets` for `let's` in a post. What
carries over is stance and rhythm, not surface error:

- **Sentence length.** Aim for his median, not the current one. Short
  sentences, varied, with the occasional long one when working something out.
  If every sentence in a paragraph is the same length, rewrite the paragraph.
- **Keep the uncertainty that was real.** If he did not know why something
  worked, the post says so. If a question is still open, it is open in the
  present tense, not filed under "Open:" at the end.
- **Questions belong in the body**, not just at the end.
- **Spaced hyphen over em dash**, matching his habit — and few of either.
- **Say the blunt thing.** "This was a mess." "I had no idea what that graph
  was telling me." Not "this proved suboptimal."
- **Let the enthusiasm through.** If something was cool, say it was cool. The
  GitHub samples have exclamation marks and an emoji; the blog has neither.
- **Undersell rather than oversell.** Closer to "Sorry for the big PR" than
  to a confident thesis statement.
- **The reader-stance test:** somewhere in the post, look at the thing as the
  person receiving it rather than the person who built it.

## The test

Read the draft and ask whether the person in the samples above could have
written it — specifically the person who wrote the pi-led-matrix PR
descriptions, since those are him writing for an audience. Not "is it clean":
clean is what the first seven posts were. Could Nate have typed this at 11pm
with a half-formed idea and not gone back to fix it?
