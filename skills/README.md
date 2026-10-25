# skills

Claude Code skills that belong to this blog, kept here so they are version
controlled alongside the posts they produce.

## natelewis-blog

Drafts, previews, illustrates and publishes posts. Two files:

- `SKILL.md` — the workflow: arguments, post shapes, front matter, the
  banner and photo steps, the publish sequence.
- `VOICE.md` — the voice reference, built from ~48,000 words of session
  chat plus pre-2026 GitHub PRs and comments. `SKILL.md` points at it and
  says to read it before drafting any prose.

### Why it lives here

A reader called the first seven posts AI slop and said they didn't sound
like me. The fix was `VOICE.md`, and it took a corpus extraction to build.
It was sitting in `~/.claude/skills/` with no history and no backup, which
is a bad place for the thing the whole blog's voice now depends on.

### How it is wired up

Claude Code loads skills from `~/.claude/skills/`. That path is a symlink
into this repo:

```bash
ln -s /Users/nlewis/projects/natelewis-dev/skills/natelewis-blog ~/.claude/skills/natelewis-blog
```

So edits made here are live immediately, and edits Claude makes to the skill
show up as changes in this repo.

To set it up on another machine, clone the repo and run that `ln -s` with
the path the checkout actually landed at.

Two things to know. The skill stops loading if the repo is moved or deleted,
because the symlink goes dead — re-point it rather than recreating the
files. And nothing in the Next.js build reads this directory; it is here for
version control only.
