---
schema: 2
title: "In 2017 I wrapped a 1966 chatbot in a Promise and called it AI"
date: "2026-09-05"
description: "I built a voice assistant on a Raspberry Pi in 2017 and put a 1966 chatbot where the brain goes. Ran the whole thing again this year next to a local model."
tldr:
  - "In 2017 I built a voice assistant on a Raspberry Pi, with eleven hand-written rules to work out what each request meant."
  - "Running it again in 2026, the rules pass all 34 of their old tests, but a small AI model at home did better on new sentences."
  - "Told to say \"none\" when no command fit, the model said \"stop\" in 4 of 11 cases, so that problem moved rather than went away."
  - "The part I built in an afternoon - a loop that asks for missing details and then acts - is how today's AI agents work."
tags: ["software-engineering", "agents", "llm", "ollama", "nlp"]
accent: "#22c55e"
draft: false
banner: "A therapy session in a 2017 living room: the person lies on a couch with an arm over their forehead, talking, while in the therapist's armchair opposite sits an open laptop propped upright with a Raspberry Pi and a USB microphone on the seat cushion beside it; the laptop screen shows the line '>> Your laptop keeps crashing ?' and a notepad and pen rest on the chair arm, untouched."
---

Google Home shipped in November 2016. I wanted one. More than that I wanted
to know what was inside it, so I built one on the kitchen table on a
Raspberry Pi instead and found out which parts were actually hard.

It was called [Edwin](https://github.com/natelewis/edwin-the-assistant). Two
npm modules came out of it and are still up: a 1966 chatbot with a Promise
around it, and eleven rules that turn "turn up the music" into
`{intent: "turn", context: "music"}`.

I went back and read all of it this year, which was a strange afternoon. The
loop I hand-built in 2017 is the loop I run an agent inside of every day now.
The intent files are tool definitions. A step that asks for a missing field
is the model asking for a parameter. `failReply` is the model declining. I
put a regex where the model goes because in 2017 there was nothing else to
put there.

So I had an agent run the whole thing again. The 2018 tests under Node 24,
some sentences I never thought to test, and a local model scored against the
same answers. The rules pass every test I wrote for them, all 34. The model
gets 31. The model is the one that works on anything new.

## What I built in 2017

I wanted the whole loop on hardware I owned. Talk to a microphone, have
something happen - Sonos, the lights, a text message - hear an answer, and be
able to open any piece of it and change it. Edwin ran from January 2017 to
October 2018 and got 235 commits.

The README still has the `sox` install for a Pi, the ALSA line to push audio
out the headphone jack, and a Google Speech key. Speech-to-text was the one
piece I couldn't run at home and it bugged me. Everything else was mine.

I built each stage as the smallest thing that worked and published it. Mic
first, then the speaker. Then I needed something in the middle that would
answer, so I could hear the loop close before I'd written a parser.

That is where Eliza came in.

## Wrapping a 1966 chatbot in a Promise

[eliza-as-promised](https://github.com/natelewis/eliza-as-promised) is four
commits on one day, 19 August 2017. The code is
[Norbert Landsteiner's 2005 JavaScript port](https://www.masswerk.at/elizabot/)
of Weizenbaum's ELIZA. I changed nothing in it. I added eleven lines at the
bottom:

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

That was the whole module. I wanted a `.then()` chain. The next day I
published [speak-with-eliza](https://github.com/natelewis/speak-with-eliza),
whose entire README is one line: mic → Google Speech → eliza-as-promised →
`say` → your ears. I wanted the brain to be an `await` in the middle of a
pipeline, and the package.json still says what I thought that brain was:
*"Eliza psychotherapist in Node.js as a promised based AI"*, keyword `AI`.

Inside it is 116 keyword entries, each with patterns to take a sentence apart
and templates to put it back together. There's a table that flips pronouns,
`my` → `your`, `me` → `you`, so your own sentence comes back at you as a
question. And a memory of the last 20 things you said, which it digs into
when nothing else matches.

Turn off the random choice, the way Weizenbaum's 1966 paper does for its
transcript, and you get this:

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

The last line is the rule for `you are`, with my own words dropped into slot
`(2)` and the pronouns flipped. It isn't a comeback. It just reads like one,
and honestly it's still fun to watch.

## The parser I thought was the hard part

[sentence-intent](https://github.com/natelewis/sentence-intent) came ten
months later, 14 commits between 6 and 11 June 2018. This one was a real
attempt rather than a wrapper. One dependency:
[pos](https://www.npmjs.com/package/pos), a JavaScript port of FastTag built
on Eric Brill's rule set, which labels every word (`VB`, `NN`, `DT`, `PRP`).
`getIntent()` walks a fixed list of shapes and takes the first one that fits:

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

Context is the first noun after the intent word. There are 34 tests, all
imperative, all about music, lights and texting. There's also a second block
of context rules I could never get to pass, still sitting in the file,
commented out. I left it there in 2018 and I left it there this year too.

Here's the thing I didn't see at the time. Every sentence in that test file
is a sentence I would say. So the parser learned me. Is that a fair test of
whether it understands anyone? Obviously not, but it took eight years and a
model to make me notice.

## The loop I thought was plumbing

Edwin is where the two met, and this is the part that made me want to write
any of this down. Each thing you said ran once through a chain of twelve
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
carries a `failReply`. A topic is a list of steps - each `query` names a
field, a `reply` is what to ask when that field is empty, and the last step
is a `module` to run.

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

Read that in 2026 and it's a tool definition. The modifiers are the argument
schema. A step that queries a field is the model asking you for a missing
parameter. The module is the tool call. `failReply` is the model saying it
can't help.

I took a couple of afternoons on this and a folder of JSON, and I thought of
it as plumbing. The parser got months.

## Running it again in 2026

The agent did the measuring. It cloned the four repos, ran the 2018 mocha
suite under Node 24, wrote a script that pushed the 34 suite sentences plus
11 new ones through sentence-intent, and scored
[gemma4 12B](https://ollama.com/library/gemma4) on
[ollama](https://ollama.com) against the same expected answers. One prompt,
temperature 0, JSON out, run twice - once free-form ("intent is one verb,
context is one noun"), once with Edwin's 13 intents as the only allowed list
and an instruction to answer `null` if none fit. I picked the new sentences
and read the misses myself.

| | sentence-intent (2018) | gemma4 12B, free | gemma4 12B, intent list |
| --- | --- | --- | --- |
| 34-sentence suite | 34/34 | 23/34 | 31/34 |
| per sentence | ~1 ms | 463 ms | 434 ms |

Scores ignore case, `Nate` versus `nate`. My own rules have the same problem
further down.

The rules win their own suite, which you'd hope. The three misses with the
intent list are more interesting. For "turn on the kitchen light" the model
said `turn/light` where my 2018 answer was `turn/kitchen`. Kitchen is where,
not what - the model is right and I was wrong. The other two are "Send text
to Nate" with and without a message: model says `send/Nate`, I said
`send/text`, and I'd take the model's answer there too.

Now the 11 sentences the suite never saw:

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

The rules got a complete pair on 3 of 8, and not one with a verb Edwin knew
what to do with. Free-form, the model got something usable on every row, but
its vocabulary wandered - `turn off`, `increase`, `adjust` - which is exactly
what a fixed list is for.

Then give it the list and tell it to answer `null` when nothing fits, and it
says `stop` instead on 4 of the 11. "Louder" is not `stop`. "Set a timer" is
not `stop`. That's the same `failReply` problem from `turn.json`, still open,
except now it lives in the prompt instead of the parser. I didn't try a
bigger model. That's the obvious next thing and I haven't done it.

One more thing the run turned up, which is my fault and not the model's. My
rules return `Lights`, `Louder`, `What` and `Set` with a capital letter,
because the early shapes read from the lowercased word list and the fallback
shapes read from the tagger's output in original case. Line 46 of
`Sentence.js` calls `.replace()` and throws the result away. Edwin lowercased
the intent one layer up, so it never showed. Same family of bug as the
model's `Nate`.

## What I got wrong

Both modules install and run on Node 24 with no changes, which I did not
expect from a 2017 `"engines": { "node": "7" }`.

The shape was right. Get an intent and its arguments out of a sentence, ask
for what's missing, call a module, say no when nothing fits. That's the loop
I run an agent inside of every day.

What I got wrong was which part was hard. Months on the parser. An afternoon
on the loop. The parser is now one model call at temperature 0, and every
part I called plumbing is the part that still needs a person - which intents
exist, what their arguments are, what to ask when one is empty, and what
"none of these" is supposed to look like.

The piece I keep turning over is where it runs. In 2017 the only brain I
could put on my own hardware was a lookup table from 1966, and the one thing
I had to send out of the house was my voice. In 2026 it's a 12B model on a
laptop answering in under half a second, and that still feels like it
shouldn't work. Same loop, same kitchen. The middle got filled in.

Still open: the `null` case on a bigger local model, and whether Eliza's
20-statement memory is doing anything a context window doesn't. That second
one might be a whole other post, or it might be nothing.

## Links

- [eliza-as-promised](https://github.com/natelewis/eliza-as-promised), [speak-with-eliza](https://github.com/natelewis/speak-with-eliza), [sentence-intent](https://github.com/natelewis/sentence-intent) and [edwin-the-assistant](https://github.com/natelewis/edwin-the-assistant) on GitHub
- [elizabot.js](https://www.masswerk.at/elizabot/), Norbert Landsteiner's 2005 port that eliza-as-promised wraps
- Weizenbaum, [ELIZA — A Computer Program For the Study of Natural Language Communication Between Man and Machine](https://dl.acm.org/doi/10.1145/365153.365168), CACM 9(1), 1966
- [pos](https://www.npmjs.com/package/pos), the part-of-speech tagger sentence-intent depends on
- [gemma4](https://ollama.com/library/gemma4) on [ollama](https://ollama.com)
