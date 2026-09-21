---
schema: 2
title: "Google sign-in is a browser event. Making it an identity is the server's job."
date: "2026-09-13"
description: "How Google-only sign-in gets a server-verifiable identity on Next.js and Firebase: a session cookie, a static layout, and a proof that never clicks the popup."
tldr:
  - "A Google sign-in is a browser event. The server knows nothing until a route handler trades the ID token for a session cookie."
  - "One cookies() call in the root layout makes every page dynamic. Read it only where identity is needed."
  - "The agent can't click a Google popup, so it proved sign-in from the other end: mint a token, post it, verify the cookie."
  - "Open: sign-out doesn't revoke tokens, and nothing uses the identity yet."
tags: ["software-engineering", "nextjs", "firebase", "auth", "agents"]
accent: "#0ea5e9"
draft: false
banner: "A person in a beanie standing at a heavy wooden front door, holding it open for a visitor while looking down at a small paper ticket the visitor has handed over. Behind them, down the hall, a second locked door with a small window; the ticket is being checked against it. On the doormat, a Google-coloured four-dot pattern."
---

I have a Next.js site that has no accounts. I wanted it to have sign-in, not
to store anything about anyone yet, but so that later there is a stable id
for preferences and alerts to hang off, and so a programmatic client can say
who it is acting for. Sign in with a Google account, and only a Google
account, on the Firebase project the site already runs on.

The Firebase client SDK makes the browser half a few lines: a popup, a
Google provider, a user object. That is a browser event, and it is not yet an
identity. **Nothing about a signed-in browser reaches the server unless
something carries it across.** Building that something was mostly routine.
Two parts were not: the obvious place to read it, the root layout, would have
made every page on the site render on demand; and the agent doing the work
could not click a Google popup, so proving it worked had to come from the
other end. This is how the server half was built.

## The problem

After a Firebase sign-in the browser holds an ID token that lasts an hour,
and by default nothing on the server ever sees it. A header that shows an
avatar can be done from the browser alone. A preference saved against a
user, an alert sent to one, or a tool call made on someone's behalf cannot:
each needs the server to know who is asking, from something it can verify
itself.

Before any code, I had the agent read the project's Identity Toolkit config
and IAM policy, because a design that needs an IAM change is a different
design from one that does not. The Google provider was on, the domains were
authorised, and the compute service account already held the role the Admin
SDK needs to mint session cookies. **No IAM change, no console work.** That
settled the shape of it before a line was written.

## What I tried

### A session cookie rather than an ID token in a cookie

Two common ways to give a Next.js server a Firebase identity: put the
browser's ID token in a cookie and verify it per request, or exchange it once
for a [Firebase session cookie](https://firebase.google.com/docs/auth/admin/manage-cookies)
and verify that.

The first needs no credentials on the server, but the token lasts an hour, so
a returning visitor's first render is signed-out until client JavaScript wakes
up and re-posts a fresh one. The second lasts up to fourteen days and the
server knows you on the first byte, but minting one is an authorised Admin SDK
call. The IAM check had already said that was free, so I took the session
cookie.

The server side is three functions; the one that matters is the verifier,
which returns `null` and never throws, because an invalid cookie is a visitor
and every page renders for one:

```ts
export async function verifySessionCookie(cookie: string | undefined): Promise<AuthUser | null> {
  if (!cookie) return null;
  try {
    return toAuthUser(await getAuth(adminApp()).verifySessionCookie(cookie));
  } catch {
    return null;
  }
}
```

`AuthUser` is four fields: `uid`, `email`, `displayName`, `photoUrl`. That is
the whole of what the site knows about a person, and none of it is written
anywhere. A route handler does the exchange: the browser posts the ID token it
was just issued, the handler mints the cookie and sets it `httpOnly`,
`SameSite=Lax`; a `DELETE` clears it. The cookie is named `__session` because
Firebase Hosting's CDN strips every other cookie name, and although this site
is on App Hosting, which does not, there is nothing to gain from a name that
would silently stop working if that ever changed.

**Verifying needs no credentials at all**, so a laptop without any renders
every page signed-out and only the mint fails, as a 401 from one route. I
preferred that to a 500 on every page.

### The popup, and errors that propagate

The browser side is `signInWithPopup`. `signInWithRedirect` depends on
third-party storage on the `authDomain` origin, which Safari has blocked for
years and Chrome now does too; Firebase's own
[guidance](https://firebase.google.com/docs/auth/web/redirect-best-practices)
says use the popup. The agent's first `signInWithGoogle` caught and logged
errors, which is the shape most examples have. I had it throw instead: a
caller needs to tell a closed popup from a finished sign-in, and a swallowed
error makes the two identical.

### Nothing at import time, and a lint rule that changed the design

A module that calls `initializeApp` at the top level throws wherever the
`NEXT_PUBLIC_FIREBASE_*` keys are not set, and that is Storybook, every test,
and a fresh clone. So the package initialises nothing on import; the app and
auth client are built on first use behind `isFirebaseConfigured()`.

The agent's first `AuthProvider` decided "sign-in unavailable" inside the
effect that subscribes to Firebase, by catching the throw and calling
`setState`. The React Compiler lint rule `react-hooks/set-state-in-effect`
rejected it, and the fix was better than the original: **decide before the
first render**, as a lazy initial state, and never subscribe at all when the
keys are missing.

```ts
const [status, setStatus] = useState<AuthStatus>(() =>
  isFirebaseConfigured() ? 'loading' : 'unavailable'
);

useEffect(() => {
  if (!isFirebaseConfigured()) return undefined;
  return onIdTokenChanged(async (state) => {
    if (!state) { setUser(null); setStatus('signed-out'); return; }
    await establishServerSession(state.idToken);   // POST /api/auth/session
    setUser(state.user);
    setStatus('signed-in');
  });
}, [router]);
```

The listener is `onIdTokenChanged`, not `onAuthStateChanged`, on purpose: it
also fires on every hourly token refresh, and each firing re-mints the cookie.
That is what keeps a fourteen-day server session alive for a browser that is
just left open. `router.refresh()` runs only after an explicit sign-in or
sign-out, the two moments a server render would say something different.

### Keeping the root layout static

The obvious place to read the cookie is the root layout, so the header can
render the avatar on the server. In the App Router, `cookies()` makes its
caller dynamic, and route segment config is inherited, so one call in the
layout makes every route in the app render on demand, including the ones that
read nothing.

So the layout never reads it. The header learns the user from the browser-side
listener, and the account slot renders nothing until Firebase has said whether
a user is persisted, rather than a "Sign in" that flips to an avatar a moment
later. A page that needs the user for its own content is already dynamic for
the database's sake and calls `getSessionUser()` itself, wrapped in React's
`cache` so a page and its `generateMetadata` verify once.

The check was `next build`. The four pages that were static before printed
`○` after, and the ones that read the database printed `ƒ`, same as before.

### Proving the server half without clicking the popup

The agent could not finish a sign-in. The browser it drives blocks a popup
opened by anything but a person's own click, and I would not have it type a
Google password even if it could. So the interactive half was mine to click
later, and the question was how to prove everything behind it without it.

I had the agent build the proof from the other end: mint a custom token with
the Admin SDK, exchange it for a real ID token against the Identity Toolkit
REST endpoint, post that to the running dev server's route, and hand the
cookie that came back to `verifySessionCookie`.

One snag worth recording. `createCustomToken` needs a private key to sign
with, and a person's ADC cannot sign, so the script needed a service-account
key file. **That was a limitation of the test script, not the feature**: the
dev server it was posting to stayed on plain ADC, because `createSessionCookie`
is a REST call that signs nothing locally. Worth being clear about, since the
error, `Failed to determine service account`, reads like the feature is broken.

```
POST status 200 | set-cookie: __session=<redacted>; Path=/; Max-Age=1209600; HttpOnly; SameSite=lax
verifySessionCookie -> { uid: 'e2e-session-smoke', email: null, displayName: null, photoUrl: null }
verifySessionCookie(garbage) -> null
DELETE status 200 | __session=; Expires=Thu, 01 Jan 1970 00:00:00 GMT
POST bad token status 401
cleaned up test user e2e-session-smoke
```

## What happened

Lint, typecheck, 152 Vitest tests (7 new) and 4 new Jest tests for the server
module passed, and a production `next build` showed the static pages still
static. The server half is proven end to end against a running server on plain
ADC. The popup itself, on the deployed site, was the one box left unchecked on
the pull request. It needs a person's click.

## Where it landed

Google-only sign-in, a fourteen-day server session, and a `getSessionUser()`
any server component or route handler can call. Nothing about a user in the
database.

Open: sign-out clears the cookie and signs the browser out, but does not
revoke the account's refresh tokens, so there is no "sign out everywhere" yet.
The hourly re-mint is one Identity Toolkit call per signed-in browser per
hour, which is nothing at this size and was not measured at any other. And
the part that uses the identity for anything, preferences, alerts, a token
for a programmatic client, comes next.

## Links

- [Manage session cookies](https://firebase.google.com/docs/auth/admin/manage-cookies) — Firebase Admin SDK docs
- [Best practices for using signInWithRedirect on browsers that block third-party storage access](https://firebase.google.com/docs/auth/web/redirect-best-practices)
- [`cookies()` in the Next.js App Router](https://nextjs.org/docs/app/api-reference/functions/cookies) — why reading it makes a route dynamic
- [Route segment config](https://nextjs.org/docs/app/api-reference/file-conventions/route-segment-config) — the inheritance that keeps `force-dynamic` off the layout
- [`react-hooks/set-state-in-effect`](https://react.dev/reference/eslint-plugin-react-hooks/lints/set-state-in-effect) — the rule that improved the provider
- [`accounts:signInWithCustomToken`](https://firebase.google.com/docs/reference/rest/auth#section-verify-custom-token) — the REST call the smoke test used
