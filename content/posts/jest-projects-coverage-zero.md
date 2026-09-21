---
schema: 2
kind: note
title: "Jest projects: collectCoverageFrom is relative to each project, so coverage reads 0%"
date: "2026-09-21"
description: "Nine Jest configs became one root config with projects, and coverage dropped to 0% for every package. The glob was matching from the wrong root."
tags: ["software-engineering", "testing", "ci"]
accent: "#10b981"
draft: false
---

While [cutting a CI run from 485 s to 108 s](/blog/ci-485-to-108-seconds),
nine small libraries that each ran their own Jest process became one root
config listing them as [`projects`](https://jestjs.io/docs/configuration#projects-arraystring--projectconfig).
One process instead of nine, 40 s to 6–11 s. The tests passed. **Coverage
for every package reported 0%.**

The root config had `collectCoverageFrom: ["*/src/**"]`, written from the
repository root's point of view. With `projects`, Jest evaluates that glob
**relative to each project's own root**, not the root config's, so
`*/src/**` matched nothing inside `packages/foo/` and Jest counted no files.
The fix was one character:

```js
// jest.config.js at the repo root
module.exports = {
  projects: ["<rootDir>/packages/*"],
  collectCoverageFrom: ["src/**"],   // was "*/src/**": each project resolves this from its own root
};
```

Coverage came back at the same 97% lines / 88% branches as before.

What caught it was not the test run, which was green, but diffing the
coverage table row for row against the previous run. **A refactor of test
infrastructure needs a before/after on something other than "it passed."**
