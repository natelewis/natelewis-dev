---
schema: 2
title: "A signed-in browser tells my server nothing"
seoTitle: "Google sign-in to a server identity on Next.js and Firebase"
date: "2026-09-13"
description: "How Google-only sign-in gets a server-verifiable identity on Next.js and Firebase: a session cookie, a static layout, and a proof that never clicks the popup."
tldr:
  - "Signing in with Google happens in the browser, so the server has no idea who you are until something tells it."
  - "The fix: the server swaps Google's short-lived token for its own session cookie, which any page can check."
  - "Reading that cookie in the layout every page shares would stop the site caching pages, so only pages that need it read it."
  - "An AI agent can't click Google's sign-in popup, so it tested sign-in from the server's side instead."
tags: ["software-engineering", "nextjs", "firebase", "auth", "agents"]
accent: "#0ea5e9"
draft: false
banner: "A person in a beanie standing at a heavy wooden front door, holding it open for a visitor while looking down at a small paper ticket the visitor has handed over. Behind them, down the hall, a second locked door with a small window; the ticket is being checked against it. On the doormat, a Google-coloured four-dot pattern."
---
I have a Next.js site with no accounts. I wanted sign-in on it. Not to store
anything about anyone yet - just so that later there's a stable id for
preferences and alerts to hang off, and so a programmatic client can say who
it's acting for. Google account only, on the Firebase project the site
already runs on.

The Firebase client SDK makes the browser half a few lines. A popup, a
Google provider, a user object. That's a browser event and it isn't an
identity yet. Nothing about a signed-in browser reaches the server unless
something carries it across.

Building that something was mostly routine. Two parts weren't. The obvious
place to read the identity, the root layout, would have made every page on
the site render on demand. And the agent doing the work couldn't click a
Google popup, so proving it worked had to come from the other end.

## Why the server can't see you

After a Firebase sign-in the browser holds an ID token that lasts an hour.
By default nothing on the server ever sees it.

A header that shows an avatar is fine from the browser alone. A preference
saved against a user, an alert sent to one, a tool call made on someone's
behalf - none of those are. Each needs the server to know who's asking, from
something it can verify itself.

Before writing any code I had the agent read the project's Identity Toolkit
config and IAM policy. A design that needs an IAM change is a different
design from one that doesn't, and I'd rather know that first. The Google
provider was on, the domains were authorised, and the compute service
account already held the role the Admin SDK needs to mint session cookies.
No IAM change, no console work. That settled the shape of it before a line
was written.

## Session cookie, not an ID token in a cookie

Two common ways to give a Next.js server a Firebase identity. Put the
browser's ID token in a cookie and verify it per request, or exchange it
once for a [Firebase session cookie](https://firebase.google.com/docs/auth/admin/manage-cookies)
and verify that.

The first needs no credentials on the server, but the token lasts an hour,
so a returning visitor's first render is signed-out until client JavaScript
wakes up and re-posts a fresh one. The second lasts up to fourteen days and
the server knows you on the first byte, but minting one is an authorised
Admin SDK call.

The IAM check had already said that was free, so I took the session cookie.

The server side is three functions. The one that matters is the verifier,
which returns `null` and never throws, because an invalid cookie is just a
visitor and every page renders for one:

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

`AuthUser` is four fields: `uid`, `email`, `displayName`, `photoUrl`. That's
the whole of what the site knows about a person, and none of it is written
anywhere.

A route handler does the exchange. The browser posts the ID token it was
just issued, the handler mints the cookie and sets it `httpOnly`,
`SameSite=Lax`, and a `DELETE` clears it. The cookie is named `__session`
because Firebase Hosting's CDN strips every other cookie name. This site is
on App Hosting, which doesn't, but there's nothing to gain from a name that
would silently stop working if that ever changed.

Verifying needs no credentials at all, which I liked. A laptop without any
renders every page signed-out and only the mint fails, as a 401 from one
route. Better than a 500 on every page.

## The popup, and errors that propagate

The browser side is `signInWithPopup`. `signInWithRedirect` depends on
third-party storage on the `authDomain` origin, which Safari has blocked for
years and Chrome now does too. Firebase's own
[guidance](https://firebase.google.com/docs/auth/web/redirect-best-practices)
says use the popup.

The agent's first `signInWithGoogle` caught and logged errors, which is the
shape most examples have. I had it throw instead. A caller needs to tell a
closed popup from a finished sign-in, and a swallowed error makes those two
identical.

## Nothing at import time

A module that calls `initializeApp` at the top level throws wherever the
`NEXT_PUBLIC_FIREBASE_*` keys aren't set. That's Storybook, every test, and
a fresh clone. So the package initialises nothing on import; the app and
auth client are built on first use behind `isFirebaseConfigured()`.

The agent's first `AuthProvider` decided "sign-in unavailable" inside the
effect that subscribes to Firebase, by catching the throw and calling
`setState`. The React Compiler lint rule `react-hooks/set-state-in-effect`
rejected it.

The fix was better than the original, which doesn't always happen with lint
rules. Decide before the first render, as a lazy initial state, and never
subscribe at all when the keys are missing.

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

The listener is `onIdTokenChanged`, not `onAuthStateChanged`, on purpose. It
also fires on every hourly token refresh, and each firing re-mints the
cookie. That's what keeps a fourteen-day server session alive for a browser
somebody just left open. `router.refresh()` runs only after an explicit
sign-in or sign-out, the two moments a server render would say something
different.

## Keeping the root layout static

The obvious place to read the cookie is the root layout, so the header can
render the avatar on the server.

In the App Router, `cookies()` makes its caller dynamic, and route segment
config is inherited. So one call in the layout makes every route in the app
render on demand, including the ones that read nothing. That's a big cost
for an avatar.

So the layout never reads it. The header learns the user from the
browser-side listener, and the account slot renders nothing until Firebase
has said whether a user is persisted - rather than a "Sign in" that flips to
an avatar a moment later. A page that needs the user for its own content is
already dynamic for the database's sake and calls `getSessionUser()` itself,
wrapped in React's `cache` so a page and its `generateMetadata` verify once.

The check was `next build`. The four pages that were static before printed
`○` after, and the ones that read the database printed `ƒ`, same as before.

## Proving it without clicking the popup

The agent couldn't finish a sign-in. The browser it drives blocks a popup
opened by anything but a person's own click, and I wouldn't have it type a
Google password even if it could.

So the interactive half was mine to click later. The question was how to
prove everything behind it without that.

I had the agent build the proof from the other end. Mint a custom token with
the Admin SDK, exchange it for a real ID token against the Identity Toolkit
REST endpoint, post that to the running dev server's route, and hand the
cookie that came back to `verifySessionCookie`.

One snag worth recording, because the error message is misleading.
`createCustomToken` needs a private key to sign with, and a person's ADC
can't sign, so the script needed a service-account key file. That's a
limitation of the test script, not the feature - the dev server it was
posting to stayed on plain ADC, because `createSessionCookie` is a REST call
that signs nothing locally. Worth being clear about, since the error,
`Failed to determine service account`, reads like the feature is broken.

```
POST status 200 | set-cookie: __session=<redacted>; Path=/; Max-Age=1209600; HttpOnly; SameSite=lax
verifySessionCookie -> { uid: 'e2e-session-smoke', email: null, displayName: null, photoUrl: null }
verifySessionCookie(garbage) -> null
DELETE status 200 | __session=; Expires=Thu, 01 Jan 1970 00:00:00 GMT
POST bad token status 401
cleaned up test user e2e-session-smoke
```

Lint, typecheck, 152 Vitest tests (7 new) and 4 new Jest tests for the
server module all passed, and a production `next build` showed the static
pages still static.

The popup itself, on the deployed site, was the one box left unchecked on
the pull request. It needs a person's click.

## What I ended up with

Google-only sign-in, a fourteen-day server session, and a `getSessionUser()`
any server component or route handler can call. Nothing about a user in the
database.

Sign-out clears the cookie and signs the browser out, but it doesn't revoke
the account's refresh tokens, so there's no "sign out everywhere" yet. The
hourly re-mint is one Identity Toolkit call per signed-in browser per hour,
which is nothing at this size - though I haven't measured it at any other
size, so I don't actually know where that stops being true.

And the part that uses the identity for anything, preferences, alerts, a
token for a programmatic client, is next. Right now I've built a very
careful way to know who you are and nothing that cares.

## Links

- [Manage session cookies](https://firebase.google.com/docs/auth/admin/manage-cookies) — Firebase Admin SDK docs
- [Best practices for using signInWithRedirect on browsers that block third-party storage access](https://firebase.google.com/docs/auth/web/redirect-best-practices)
- [`cookies()` in the Next.js App Router](https://nextjs.org/docs/app/api-reference/functions/cookies) — why reading it makes a route dynamic
- [Route segment config](https://nextjs.org/docs/app/api-reference/file-conventions/route-segment-config) — the inheritance that keeps `force-dynamic` off the layout
- [`react-hooks/set-state-in-effect`](https://react.dev/reference/eslint-plugin-react-hooks/lints/set-state-in-effect) — the rule that improved the provider
- [`accounts:signInWithCustomToken`](https://firebase.google.com/docs/reference/rest/auth#section-verify-custom-token) — the REST call the smoke test used
