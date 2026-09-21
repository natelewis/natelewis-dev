---
schema: 2
title: "In 2017 I wrapped a 1966 chatbot in a Promise and called it AI"
date: "2026-09-05"
description: "Two npm modules from 2017–18: a 1966 chatbot behind a Promise, and an intent parser with 34 tests. I ran them again in 2026 next to a local model."
tldr:
  - "In 2017 I built a voice assistant on a Pi: a 1966 chatbot and eleven regex rules where the model goes now."
  - "In 2026 the rules still pass their own 34 tests. A local 12B model beat them on every sentence neither had seen."
  - "Told to answer null when nothing fit, the model said stop instead, 4 times in 11. That problem just moved."
  - "I spent months on the parser and an afternoon on the loop. It was backwards."
tags: ["software-engineering", "agents", "llm", "ollama", "nlp"]
accent: "#22c55e"
draft: false
banner: "A therapy session in a 2017 living room: the person lies on a couch with an arm over their forehead, talking, while in the therapist's armchair opposite sits an open laptop propped upright with a Raspberry Pi and a USB microphone on the seat cushion beside it; the laptop screen shows the line '>> Your laptop keeps crashing ?' and a notepad and pen rest on the chair arm, untouched."
---

Google Home shipped in November 2016 and I wanted to know what was inside
it. Not by buying one: by building one on a Raspberry Pi on the kitchen table
and finding out which parts were hard. The assistant was called
[Edwin](https://github.com/natelewis/edwin-the-assistant), and two npm
modules carved out of it survive: a 1966 chatbot with a Promise around it,
and eleven rules that turn "turn up the music" into
`{intent: "turn", context: "music"}`.

Reading Edwin again in 2026, the loop is the one I run an agent inside of
every day. The intent files are tool definitions, a step that asks for a
missing field is the model asking for a parameter, and `failReply` is the
model declining. I built all of that by hand and put a regex where the model
goes, because there was nothing else to put there. So I had an agent run the
whole thing again: the 2018 test suite under Node 24, sentences I had never
tested, and a local model scored on the same sentences, on the same kind of
machine, with nothing leaving the house. **The rules still pass every test I
wrote for them. The model gets 31 of 34, and it is the one that works on the
sentences neither had seen.**

## The problem

I wanted the whole loop on hardware I owned. Talk to a microphone, have
something happen (Sonos, lights, a text message), hear an answer, and be able
to open any piece of it and change it. Edwin ran from January 2017 to October
2018 and got 235 commits. The README has instructions for `sox` on a Pi,
the ALSA line to route audio to the headphone jack, and a Google Speech key,
because speech-to-text was the one part I could not run locally and I wanted
the rest to be mine.

Each stage I learned by building the smallest version that worked and
publishing it. The mic and the speaker went first. Then I needed something to
sit in the middle and answer, so I could hear the loop close before I had
written a parser. That is where Eliza came in.

What I thought was hard, in 2017, was turning a sentence into an action and a
thing. Everything after that, deciding what to ask when a word was missing,
mapping "song" and "track" and "volume" onto the same handler, saying no when
nothing matched, I treated as plumbing. It took a couple of afternoons and a
folder of JSON.

That was backwards, and it took a model showing up to see it.

## What I tried

### A Promise around a 1966 program

[eliza-as-promised](https://github.com/natelewis/eliza-as-promised) is four commits on one day, 19 August 2017. The code is
[Norbert Landsteiner's 2005 JavaScript port](https://www.masswerk.at/elizabot/)
of Weizenbaum's ELIZA, unchanged apart from eleven lines I added at the bottom:

```javascript
ElizaBot.prototype.getResponse = function(statement) {
  var that = this;
  return new Promise(function(resolve, reject) {
    let elizaReply = that.transform(statement);
    if (that.quit) {
      resolve({final: that.getFinal()});
    } else {
      resolve({reply: elizaReply});
    }
  });
};
```

The reason was the `.then()` chain. The next day I published
[speak-with-eliza](https://github.com/natelewis/speak-with-eliza), whose whole
README is one line: mic → Google Speech → eliza-as-promised → `say` → your
ears. I wanted the "brain" to be an `await` in the middle of a pipeline, and
the package.json still says what I thought that brain was: *"Eliza
psychotherapist in Node.js as a promised based AI"*, keyword `AI`.

What is inside is 116 keyword entries, each with decomposition patterns and
reassembly templates, a table that flips pronouns (`my` → `your`, `me` →
`you`) so your sentence can be handed back to you as a question, and a memory
of the last 20 things you said that it pulls from when nothing else matches.
Run with the random choice disabled, the same way Weizenbaum's 1966 paper
reproduces its transcript, it does this:

```
>> Please tell me what's been bothering you.
<< My laptop keeps crashing
>> Your laptop keeps crashing ?
<< I think the agent broke the build
>> You say you think the agent broke the build ?
<< Everyone says AI will replace me
>> Really, everyone ?
<< You are just matching keywords
>> What makes you think I am just matching keywords ?
```

The last line is the rule for `you are`, with `(2)` filled in from my sentence
and the pronouns flipped. It is not a comeback. It reads like one.

### A part-of-speech tagger and eleven rules

[sentence-intent](https://github.com/natelewis/sentence-intent) came ten months later, 14 commits between 6 and 11 June 2018,
and it was a real attempt at the problem rather than a wrapper. The one
dependency is [pos](https://www.npmjs.com/package/pos), a JavaScript port of FastTag, built on Eric Brill's
rule set, which labels every word (`VB`, `NN`, `DT`, `PRP`). `getIntent()` then
walks a fixed list of shapes and returns the first one that fits:

```javascript
getIntent() {
  if (this.startsWithCanOrWill()) {           // "can you turn ..." → word 3
    this.intent = this.wordListLC[2]; ...
  }
  if (this.fristWordIsAVerb()) {              // "turn up the music" → "turn"
    this.intent = this.wordListLC[0]; ...
  }
  if (this.firstWordIsANounThenDeterminer()) { // "text the ..." → "text"
  ...
  if (this.hasAVerb()) {
    const firstVerb = this.getWordsByType('VB', true)[0];
    // please is a verb, lets not use it though
    if (firstVerb.toLowerCase() !== 'please') { ...
  }
  // seven more shapes, then: no intent
}
```

The context is the first noun after the intent word. There are 34 tests, all
imperative, all about music, lights and texting, and every one of them is a
sentence I would say. A second block of context rules that I could not get to
pass is still in the file, commented out.

### The loop around it

Edwin is where those two met, and reading it in 2026 was the part that made me
want to write this. Each utterance ran once through a chain of twelve
`.then()`s:

```javascript
dialog.startConversation(this.state, rawInput)
  .then((state) => dialog.respondIfEmptyStatement(state))
  .then((state) => dialog.respondIfQuitInturrupt(state))
  .then((state) => dialog.setInitialIntent(state))         // sentence-intent
  .then((state) => dialog.setInitialImpliedContext(state))
  .then((state) => dialog.respondIfInvalidIntent(state))   // "I don't know how to turn that yet."
  .then((state) => dialog.setInitialTopic(state))
  .then((state) => dialog.setInitialContextFromModifiers(state))
  .then((state) => dialog.applyAnnotation(state))          // pull fields out of the sentence
  .then((state) => dialog.processConversationSteps(state)) // ask for what is missing, then run the module
  .then((state) => this.callback(state))
```

Intents were a folder of 13 JSON files. `turn.json` maps `song`, `track`,
`sonos` and `volume` onto `music`, sends `music` to the music topic, and
carries a `failReply`. A topic is a list of steps: each `query` names a field
and a `reply` is what to ask if the field is empty, and the last step is a
`module` to run.

```json
{
  "id": "turn",
  "failReply": "I don't know how to turn that yet.",
  "contextModifiers": [
    { "context": "song",   "type": "map", "target": "music" },
    { "context": "volume", "type": "map", "target": "music" },
    { "context": "light",  "type": "phrase", "target": "lights" }
  ],
  "topicMap": [ { "context": "music", "topic": "music" } ]
}
```

In 2026 terms: **the intent files are tool definitions, the modifiers are the
argument schema, a step that queries a field is the model asking for a missing
parameter, the module is the tool call, and `failReply` is the model
declining.** I built the loop by hand and put a regex where the model goes.
Not because I chose to. There was nothing else to put there.

### Running it again next to a model

The agent's job was the measuring. It cloned the four repos, ran the 2018
mocha suite under Node 24, wrote a script that pushed the 34 suite sentences
and 11 new ones through sentence-intent, and scored
[gemma4 12B](https://ollama.com/library/gemma4) on [ollama](https://ollama.com)
against the same expected answers. One prompt, temperature 0, JSON output,
run twice: once free-form ("intent is one verb, context is one noun"), once
with Edwin's 13 intents given as the only allowed list and an instruction to
answer `null` if none fit. I picked the new sentences and read the misses.

## What happened

| | sentence-intent (2018) | gemma4 12B, free | gemma4 12B, intent list |
| --- | --- | --- | --- |
| 34-sentence suite | 34/34 | 23/34 | 31/34 |
| per sentence | ~1 ms | 463 ms | 434 ms |

Scores ignore case (`Nate` versus `nate`); the rules have the same problem
on the new sentences further down. The rules win their own suite, and the
three misses with the intent list say why that is not the point. For "turn on
the kitchen light" the model said `turn/light`, where my 2018 expected answer
was `turn/kitchen`. Kitchen is where, not what. The other two are "Send text
to Nate" with and without a message after it: the model said `send/Nate`
against my `send/text`, and I would take the model's answer. **The test suite
measured whether the code did what I wrote, not whether it understood
anyone.** Free-form, without the list, the model also drifted to `send` for
"text me a message", which is the case for the list.

The 11 sentences the suite never saw:

| sentence | rules | model, free | model, intent list |
| --- | --- | --- | --- |
| Make it louder | `make` / — | `turn` / volume | `turn` / volume |
| It is too quiet in here | `quiet` / — | `adjust` / volume | `stop` / music |
| Lights off | `Lights` / — | `turn` / lights | `stop` / lights |
| Kill the lights in the kitchen | `kill` / lights | `turn off` / lights | `turn` / lights |
| I want to hear some jazz | `want` / jazz | `play` / music | `play` / jazz |
| Louder | `Louder` / — | `increase` / volume | `stop` / volume |
| Turn it down | `turn` / — | `turn` / volume | `turn` / volume |
| Set a timer for ten minutes | `Set` / timer | `set` / timer | `stop` / timer |

The rules produced a complete pair on 3 of the 8, none with a verb Edwin knew. The
free-form model got a usable pair on every row, and its vocabulary drifted
(`turn off`, `increase`, `adjust`), which is the thing a fixed list is for.
But **given the list and told to answer `null` when nothing fit, the 12B model
answered `stop` instead on 4 of the 11.** "Louder" is not `stop`. "Set a
timer" is not `stop`. That is the `failReply` problem from `turn.json`, still
open, moved from the parser into the prompt. I did not try a larger model on
it; that is the obvious next thing and I have not done it.

One smaller thing the run turned up: my own rules return `Lights`, `Louder`,
`What` and `Set` with a capital, because the early shapes read from the
lowercased word list and the fallback shapes read from the tagger's output in
original case. Line 46 of `Sentence.js` calls `.replace()` and throws the
result away. Edwin lowercased the intent one layer up, so it never showed.
Same family of bug as the model's `Nate`.

## Where it landed

Both modules install and run unchanged on Node 24 in 2026, which is more than
I expected from a 2017 `"engines": { "node": "7" }`.

What I had right in 2017 was the shape of the thing: get an intent and its
arguments out of a sentence, ask for what is missing, call a module, say no
when nothing fits. That is the loop I now run an agent inside of every day.
What I had wrong was which part was hard. I put the months into the parser and
treated the loop as an afternoon of JSON. The parser is now one model call at
temperature 0, and everything I called plumbing is what still needs a person:
which intents exist, what the arguments are, what to ask when one is empty,
and what "none of these" looks like.

The 34 tests are what I would do differently. Every sentence in that file is
one I would say, so the parser learned me and nothing else. The eleven new
sentences took five minutes to write and six of them came back with no context
or the wrong verb.

What has not changed is where I want to run it. In 2017 the brain I could
put on my own hardware was a 116-rule lookup table from 1966, and the one
piece I had to send out of the house was speech. In 2026 the brain is a 12B
model on a laptop, answering in under half a second. I am still tinkering with
the same loop; the middle got filled in.

Open: the `null` case on a bigger local model, and Eliza's 20-statement
memory against a context window, which is a different post.

## Links

- [eliza-as-promised](https://github.com/natelewis/eliza-as-promised), [speak-with-eliza](https://github.com/natelewis/speak-with-eliza), [sentence-intent](https://github.com/natelewis/sentence-intent) and [edwin-the-assistant](https://github.com/natelewis/edwin-the-assistant) on GitHub
- [elizabot.js](https://www.masswerk.at/elizabot/), Norbert Landsteiner's 2005 port that eliza-as-promised wraps
- Weizenbaum, [ELIZA — A Computer Program For the Study of Natural Language Communication Between Man and Machine](https://dl.acm.org/doi/10.1145/365153.365168), CACM 9(1), 1966
- [pos](https://www.npmjs.com/package/pos), the part-of-speech tagger sentence-intent depends on
- [gemma4](https://ollama.com/library/gemma4) on [ollama](https://ollama.com)
