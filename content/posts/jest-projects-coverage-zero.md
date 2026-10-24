---
schema: 2
title: "Jest projects: collectCoverageFrom is relative to each project, so coverage reads 0%"
seoTitle: "Jest projects: collectCoverageFrom resolves per project"
date: "2026-09-21"
description: "Nine Jest configs became one root config with projects, and coverage dropped to 0% for every package. The glob was matching from the wrong root."
tldr:
  - "Nine libraries that each ran their own test process became one test configuration, and the run went from 40s to about 10s."
  - "The tests still passed, but the report of how much of the code they cover dropped to 0% for every package."
  - "The list of files to measure was written from the repo root; each project reads it from its own folder, so it matched nothing."
  - "Deleting one `*/` brought coverage back to 97% of lines; comparing the table to the previous run is what caught it."
tags: ["software-engineering", "testing", "ci"]
accent: "#10b981"
draft: true
---
While [cutting a CI run from 485 s to 108 s](/blog/ci-485-to-108-seconds), I
took nine small libraries that each ran their own Jest process and made them
one root config listing them as
[`projects`](https://jestjs.io/docs/configuration#projects-arraystring--projectconfig).

One process instead of nine. 40 s down to 6 or 11.

The tests passed. Coverage for every package reported 0%.

The root config had `collectCoverageFrom: ["*/src/**"]`, written from the
repository root's point of view. With `projects`, Jest evaluates that glob
relative to each project's own root, not the root config's. So `*/src/**`
matched nothing inside `packages/foo/` and Jest counted no files at all.

The fix was one character:

```js
// jest.config.js at the repo root
module.exports = {
  projects: ["<rootDir>/packages/*"],
  collectCoverageFrom: ["src/**"],   // was "*/src/**": each project resolves this from its own root
};
```

Coverage came back at the same 97% lines / 88% branches as before.

What caught it wasn't the test run, which was green the whole time. It was
diffing the coverage table row for row against the previous run, which I
only did because I'd changed test infrastructure and wanted something to
compare.

That's the bit I'd keep. A green suite tells you the tests ran. It doesn't
tell you they measured anything.
