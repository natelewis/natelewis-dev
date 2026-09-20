---
schema: 2
title: "The CI runner had two cores. Nobody had counted."
date: "2026-09-17"
description: "A first-pass CI had crept to eight minutes. I assumed slow tests. An agent and one afternoon of measuring found a two-core runner and a Postgres per test file."
tldr:
  - "GitHub-hosted runners for private repos have two cores. Jest's default is cores − 1, so every suite had run on one worker since the workflow was written."
  - "Two thirds of the slowest suite was starting a Postgres container per test file. One container plus CREATE DATABASE … TEMPLATE took it from 69 s to 10.5 s."
  - "A fix I set aside at 10% on my laptop (ts-jest isolatedModules) was worth 50% on the runner: its CPU is 3–5× slower at compile-heavy work."
  - "One job became four plus a gate named after the old job, so branch rules did not change. Wall time 485 s → 108 s, no test edited."
  - "Measure on the machine that matters. The one number I got wrong was trusting a laptop about a runner."
tags: ["ci", "github-actions", "testing", "agents"]
accent: "#10b981"
draft: false
banner: "A person sits at a small desk with a single old two-burner camp stove, and a long row of thirty-three identical pots waiting on the floor beside it, each with a lid. One pot is on the stove. Behind them on the wall, a clock face with the hands at eight minutes past."
---

A small monorepo I work on had a first-pass CI: one GitHub Actions job that
installs, builds, typechecks, lints and runs every test suite in sequence.
It took four minutes. A week of adding tests later it took eight, and my
theory was slow tests, probably the database suite recreating its schema
too often.

Half right about the second part, wrong about why it mattered. **The
runner had two cores, and I had never looked.** This is one afternoon
with an AI agent, which did the measuring and the legwork while I decided
what the numbers meant. 485 s to 108 s.

## The problem

The first instruction to the agent was "pull the per-step timings off the
last green run and tell me where the eight minutes go", not "speed up the
tests". I had a theory and did not want to act on it yet.

| step | time |
| --- | --- |
| checkout + Node + `yarn install` + build the libraries | 93 s |
| typecheck | 52 s |
| lint | 43 s |
| **tests, with coverage** | **293 s** |

Inside the test step: the backend suite 41 s, the Next.js app 41 s, nine
small libraries about 40 s between them, and **the database package
159 s**: thirty-three test files, each printing its `PASS` line four or
five seconds after the one before.

Jest runs test files in parallel by default, and these were serial. Its
default worker count is `cores − 1`, and a GitHub-hosted `ubuntu-latest`
runner has four cores for a public repository. **For a private one it has
two.** Every jest suite in the repository had been running on one worker
since the workflow was written, and nothing in the workflow file says so.

The database suite had its own problem. Each of its thirty-three files
started a `postgres:16` via [testcontainers](https://node.testcontainers.org/),
ran every migration, ran its tests, and stopped the container. Timed apart:
a test file with no container costs about 0.75 s of jest overhead; the same
file with a container, 3 s. About 1.5 s a file, times thirty-three, in
sequence: **roughly two thirds of the suite was starting Postgres.**

## What I tried

### Measuring before guessing

What each fix was worth, measured the way the runner runs: one worker,
cold jest cache.

| database suite, 1 worker | time |
| --- | --- |
| as it was | 73 s |
| with ts-jest skipping type-checks | 66 s |
| 2 workers (warm cache) | 39 s |
| 4 workers (warm cache) | 25 s |

Skipping the type-check in ts-jest came back at ten percent, and I set it
aside. That was a mistake, for a reason that only showed up on the runner.
Parallelism was worth half or more, but the runner had no cores to give.
So the container churn went first.

### One Postgres, one template, one database per file

Postgres can create a database as a copy of another,
[`CREATE DATABASE … TEMPLATE …`](https://www.postgresql.org/docs/current/manage-ag-templatedbs.html),
in about a hundred milliseconds. A jest `globalSetup` starts one container
per run and migrates the default database once; each test file gets a copy
under a random name and drops it when done. The constraint I gave the agent:
**the thirty-three test files do not change.** Same helper, same signature,
same isolation between files.

```ts
// globalSetup: one container, migrated once, then closed so it can be a template
const container = await new PostgreSqlContainer('postgres:16').start();
await migrateToLatest(dbFor(container.getConnectionUri()));
process.env.TEST_PG_URI = container.getConnectionUri();      // workers inherit env
process.env.TEST_PG_TEMPLATE = container.getDatabase();

// startTestDb, called by each file's beforeAll
const name = `test_${randomUUID().replace(/-/g, '')}`;
await sql`CREATE DATABASE ${sql.id(name)} TEMPLATE ${sql.id(template)}`.execute(admin);
// … connect to `name`, hand it to the file; stopTestDb does DROP DATABASE … WITH (FORCE)
```

A template cannot be copied while anything is connected to it, so the
setup destroys its own client before it returns; with more than one worker
that would otherwise fail intermittently.

**Single worker, 69 s to 10.5 s.** Four workers, 9.5 s. Coverage unchanged
at 97% lines / 88% branches.

### Splitting the workflow into jobs

If the runner will not give me cores, I can have four runners. The one job
became four (typecheck, lint, the database suite, everything else) behind a
fifth that only `needs:` them. The fifth is named `test`, the old job's
name, because the branch ruleset and the release script both look for a
check by that name. **A pipeline refactor should not need a repository
settings change**; if it does, it is two changes.

```yaml
test:
  needs: [typecheck, lint, test-db, test-unit]
  if: always()   # skipped ≠ failed: a skipped required check blocks the merge silently
  steps:
    - run: |
        echo '${{ toJSON(needs) }}' | jq -e 'all(.[]; .result == "success")' > /dev/null
```

The shared setup went into a composite action. The typecheck job also
stopped running `tsc --noEmit` over the libraries: the build step had just
run `tsc` over the same files with the same config, so 30 s of the 52 s
step was a repeat.

### Two small ones

The Next.js app's Vitest run was 41 s, and its own summary said
`tests 712ms, environment 16.36s, collect 10.51s`. The config set
`environment: 'jsdom'` for every file, and **three of the thirty-three
test files render anything.** Two Vitest [projects](https://vitest.dev/guide/projects),
`.tsx` tests in jsdom and `.ts` tests in `node`, made it a rule of the file
extension. Environment time 16.4 s to 2.3 s.

The nine small libraries were nine jest processes, four for packages with
no tests. One root config listing them as
[`projects`](https://jestjs.io/docs/configuration#projects-arraystring--projectconfig)
made it one process. Gotcha: the root `collectCoverageFrom` is matched
relative to *each project's* root, so `*/src/**` matched nothing and
reported 0% until it became `src/**`. Comparing the coverage table row for
row against the previous run is what caught it. **A refactor of test
infrastructure needs a before/after on something other than "it passed".**

### Measuring on the runner, and being wrong about ts-jest

After the first round the wall time was 209 s. The agent's measurements had
all been on my laptop, and on those the ts-jest change was not worth much.
On the runner, the database suite measured at 10 s locally took 80 s, with
two files at 22 s each that take 2 s on an M-series Mac. **The runner's CPU
is three to five times slower at the work ts-jest does**, compiling and
type-checking every test file against the whole program.

ts-jest 29.4 reads
[`isolatedModules`](https://kulshekhar.github.io/ts-jest/docs/getting-started/options/isolatedModules)
from the package's tsconfig and, when set, transpiles each file without
type-checking it. Safe here, because the typecheck job does that once. Every
package already passed `tsc` under that flag, so it was one line in eleven
tsconfigs. On the runner: backend suite 46 s to 18 s, small libraries 25 s
to 7 s, database suite 80 s to 54 s. **The fix set aside at ten percent was
worth half.**

### Caching what does not change

Setup was now ~90 s of every job, four times over. Two caches:

- The built libraries (`dist/`), keyed on a hash of their sources, tsconfigs
  and lockfile. **Not with `actions/cache`, which saves in a post-step even
  when the job failed.** A broken build would be cached, and since the build
  doubles as the libraries' typecheck, every later run with the same sources
  would skip both and go green.
  [`actions/cache/restore`](https://github.com/actions/cache/blob/main/restore/README.md)
  and [`save`](https://github.com/actions/cache/blob/main/save/README.md)
  as separate steps, `save` after the build, only run on success.
- `node_modules`, 1.4 GB across four directories and 240 MB compressed,
  keyed on the lockfile, linker config, Node version and every workspace
  `package.json`. A `restore-keys` prefix means a lockfile change restores
  the previous tree and `yarn install` reconciles it, instead of linking
  from nothing.

```yaml
- id: deps
  uses: actions/cache/restore@v4
  with: { path: node_modules, key: deps-${{ hashFiles('yarn.lock', '**/package.json') }}, restore-keys: deps- }
- if: steps.deps.outputs.cache-hit != 'true'
  run: yarn install
- if: steps.deps.outputs.cache-hit != 'true'
  uses: actions/cache/save@v4
  with: { path: node_modules, key: ${{ steps.deps.outputs.cache-primary-key }} }
```

Restoring 240 MB takes about 17 s against ~40 s for the install. The dist
restore is under a second.

## What happened

| | before | after, caches warm |
| --- | --- | --- |
| **wall time** | **485 s** | **108 s** |
| setup per job | 93 s | 25–38 s |
| typecheck | 52 s | 14–17 s |
| lint | 43 s | 29–36 s |
| backend tests | 41 s | 18–25 s |
| Next.js tests | 41 s | 19–32 s |
| nine small libraries | 40 s | 6–11 s |
| database suite | 159 s | 54 s |

A cold run, both caches missing, is about 145 s. Billable minutes went
from ~8 a run to ~6–7.

What did not go as expected:

- **Laptop measurements understated the CPU-bound fixes** by three to five
  times and were about right for the I/O-bound one. Which machine counts
  was a question for the start, not the second round.
- **Run-to-run variance on the runner is ±10 s per step.** Two runs of the
  same commit disagreed by that much in both directions.
- The database suite is still 54 s on the runner against 10 s locally. Two
  files are ~20 s each there, the largest tables' round-trip tests, and
  they are CPU-bound. I left them.

## Where it landed

Eight minutes to under two, merged and released the same evening, no test
changed. The first run on `main` after the merge was cold: GitHub scopes
cache reads to the base branch plus the current branch, so `main` could
not see the caches the PR had saved until it had saved its own.

What the agent changed was the cost of measuring. Step timings out of a CI
log, a test file timed with and without its container, a config flag A/B'd
on a cold cache, two coverage tables diffed: each is ten minutes I would
usually have talked myself out of, and it did them in seconds, so I did all
of them. **Most of the afternoon went on choosing the next measurement, and
the one I got wrong was believing a laptop number about a runner.**

Still open: the two slow database files, and `yarn install` on a cache miss
at 40 s a job. Neither is on the critical path of an ordinary PR.

## Links

- [About GitHub-hosted runners — standard runners for private repositories](https://docs.github.com/en/actions/using-github-hosted-runners/using-github-hosted-runners/about-github-hosted-runners#standard-github-hosted-runners-for-private-repositories)
- [Jest CLI: `--maxWorkers`](https://jestjs.io/docs/cli#--maxworkersnumstring) and [configuration: `projects`](https://jestjs.io/docs/configuration#projects-arraystring--projectconfig)
- [Testcontainers for Node](https://node.testcontainers.org/)
- [PostgreSQL: template databases](https://www.postgresql.org/docs/current/manage-ag-templatedbs.html)
- [ts-jest: `isolatedModules`](https://kulshekhar.github.io/ts-jest/docs/getting-started/options/isolatedModules)
- [Vitest: projects](https://vitest.dev/guide/projects) and [`environment`](https://vitest.dev/config/#environment)
- [`actions/cache/restore`](https://github.com/actions/cache/blob/main/restore/README.md) and [`actions/cache/save`](https://github.com/actions/cache/blob/main/save/README.md)
