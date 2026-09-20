---
schema: 2
title: "Google sign-in is a browser event. Making it an identity is the server's job."
date: "2026-09-13"
description: "How Google-only sign-in gets a server-verifiable identity on Next.js and Firebase: a session cookie, a static layout, and a proof that never clicks the popup."
tldr:
  - "A Firebase Google sign-in is a browser event; the server knows nothing until something carries it across. That something is a session cookie."
  - "The browser posts its hourly ID token to one route handler; the server verifies it and mints a 14-day session cookie. getSessionUser() reads it anywhere."
  - "Reading the cookie in a layout would make every page dynamic. Keeping the layout static and reading it only where identity is needed keeps prerendering."
  - "An agent cannot click a Google popup, so the proof mints a custom token with the Admin SDK, exchanges it for a real ID token, and posts that to the same route."
  - "Still open: sign-out does not revoke refresh tokens, and nothing yet uses the identity for anything."
tags: ["nextjs", "firebase", "auth", "agents"]
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
identity. **The site's server renders pages and answers route handlers, and
nothing about a signed-in browser reaches it unless something carries it
across.** This is how that half was built, with an agent doing the typing.

## The problem

The site is Next.js on the App Router. Server components read the database
in-process through a GraphQL schema; route handlers take what is posted to
them. After a Firebase sign-in the browser holds an ID token that lasts an
hour, and by default nothing on the server ever sees it. A header that shows
an avatar can be done from the browser alone. A preference saved against a
user, an alert sent to one, or a tool call made on someone's behalf cannot:
each needs the server to know who is asking, from something it can verify
itself.

The work came down to how the server learns the user, how to keep that from
making every page dynamic, and how to prove it works when the agent doing the
work cannot click a Google popup.

Before any code, I had the agent check what the project itself would allow,
because a design that needs an IAM change is a different design from one that
does not. It read the Identity Toolkit admin config and the project's IAM
policy:

- The Google provider was already enabled.
- The site's domain, `localhost` and the App Hosting domains were already
  authorized.
- The App Hosting compute service account already held
  `roles/firebase.sdkAdminServiceAgent`, which is what the Admin SDK needs to
  mint session cookies.

**No IAM change, no console work.** That settled the shape of it before a line
was written: the Admin SDK could mint session cookies in production as it
stood.

## What I tried

### A session cookie rather than an ID token in a cookie

There are two common ways to give a Next.js server a Firebase identity. Put
the browser's ID token in a cookie and verify it per request, or exchange the
ID token once for a [Firebase session cookie](https://firebase.google.com/docs/auth/admin/manage-cookies)
and verify that.

The first needs no credentials on the server: verifying an ID token is a
signature check against Google's public keys. But the token lasts an hour, so
the cookie is stale for a returning visitor until client JavaScript wakes up,
refreshes it and re-posts it, and the server's first render of the page is
signed-out. The second lasts up to fourteen days and the server knows you on
the first byte, but minting one is an Admin SDK call that has to be
authorised.

The IAM check had shown the compute service account could mint one without
any change, so I took the session cookie. The
auth package is one workspace library with two entry points: `auth` for the
browser, `auth/server` for Node, so the Admin SDK and its credential loaders
can never reach a client bundle. The server side is three functions:

```ts
export const SESSION_COOKIE_NAME = '__session';
export const SESSION_MAX_AGE_MS = 14 * 24 * 60 * 60 * 1000;  // the longest Firebase will mint

export async function createSessionCookie(idToken: string): Promise<string> {
  return getAuth(adminApp()).createSessionCookie(idToken, { expiresIn: SESSION_MAX_AGE_MS });
}

// null, never a throw: an invalid cookie is a visitor, and every page renders for one
export async function verifySessionCookie(cookie: string | undefined): Promise<AuthUser | null> {
  if (!cookie) return null;
  try {
    return toAuthUser(await getAuth(adminApp()).verifySessionCookie(cookie));
  } catch {
    return null;
  }
}

export async function verifyIdToken(idToken: string | undefined): Promise<AuthUser | null> { /* same shape, for a bearer token */ }
```

`verifyIdToken` is there for a caller that is not a browser, which is the
shape an MCP client will arrive in later. `AuthUser` is four fields: `uid`,
`email`, `displayName`, `photoUrl`. That is the whole of what the site knows
about a person, and none of it is written anywhere.

A route handler does the exchange. The browser posts the ID token it was just
issued; the handler mints the cookie and sets it `httpOnly`, `SameSite=Lax`,
`path=/`. A `DELETE` clears it. The cookie is named `__session` because
Firebase Hosting's CDN strips every other cookie name, and although this site
is on App Hosting, which does not, there is nothing to gain from a name that
would silently stop working if that ever changed.

Credentials are Application Default Credentials in both places: the compute
service account in production, `gcloud auth application-default login` on a
laptop. **Verifying needs no credentials at all**, so a machine without them
renders every page signed-out and only the mint fails, as a 401 from the
route. I preferred that to a 500 on every page.

### The popup, and errors that propagate

The browser side is `signInWithPopup` with a `GoogleAuthProvider`.
`signInWithRedirect` depends on third-party storage on the `authDomain`
origin, and the site's domain is not the auth domain. Safari has blocked that
for years and Chrome now does too; Firebase's own
[guidance](https://firebase.google.com/docs/auth/web/redirect-best-practices)
lists the popup as the fix, since it completes over `postMessage`. The agent's
first `signInWithGoogle` caught and logged errors, which is the shape most
examples have. I had it throw instead: a caller needs to tell a closed popup
from a finished sign-in, and a swallowed error makes the two identical.

### Nothing at import time, and a lint rule that changed the design

The package initialises nothing when it is imported. `isFirebaseConfigured()`
checks the two public keys, and the Firebase app and auth client are built on
first use. This matters more than it looks: a module that calls
`initializeApp` at the top level throws wherever the `NEXT_PUBLIC_FIREBASE_*`
keys are not set, and that is Storybook, every test, and a fresh clone. Any
component that transitively imports it, even for an unrelated hook from the
same barrel, goes down with it.

The agent's first `AuthProvider` decided "sign-in unavailable" inside the
effect that subscribes to Firebase, by catching the throw and calling
`setState`. The React Compiler lint rule `react-hooks/set-state-in-effect`
rejected it. The fix was better than the original: **decide before the first
render**, as a lazy initial state, and never subscribe at all when the keys
are missing.

```ts
const [status, setStatus] = useState<AuthStatus>(() =>
  isFirebaseConfigured() ? 'loading' : 'unavailable'
);

useEffect(() => {
  if (!isFirebaseConfigured()) return undefined;
  return onAuthUserChanged(async (state) => {
    if (!state) { setUser(null); setStatus('signed-out'); return; }
    await establishServerSession(state.idToken);   // POST /api/auth/session
    setUser(state.user);
    setStatus('signed-in');
    // router.refresh() only when an explicit signIn() is waiting on this
  });
}, [router]);
```

The listener is `onIdTokenChanged`, not `onAuthStateChanged`, on purpose. It
fires on load, on sign-in and on every hourly token refresh, and each firing
re-posts the token, which re-mints the cookie. That is what keeps a
fourteen-day server session alive for a browser that is just left open, and
what heals a cookie that lapsed while the client's own persistence did not.
`router.refresh()` runs only after an explicit sign-in or sign-out, the two
moments a server render would say something different than it did. Refreshing
on the background re-mint would re-render the page every hour for no visible
change.

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
`○` after, and the ones that read the database printed `ƒ`, same as before. Wrapping the layout in a
client provider cost nothing there.

### Proving the server half without clicking the popup

The agent could not finish a sign-in. The browser it drives blocks a popup
opened by anything but a person's own click, and I would not have it type a
Google password even if it could. So the interactive half was mine to click
later, and the question was how to prove everything behind it without it.

I had the agent build the proof from the other end: mint a custom token with
the Admin SDK, exchange it for a real ID token against the Identity Toolkit
REST endpoint, post that to the running dev server's route, and hand the
cookie that came back to `verifySessionCookie`.

Two snags. The script lived outside the repo and could not resolve the
workspace packages until it ran with `NODE_PATH` pointing at the repo's
`node_modules`; three runs lost to module resolution that had nothing to do
with auth. And `createCustomToken` needs a private key to sign with. A person's
ADC cannot sign blobs, so the script needed the service-account key file.
**That was a limitation of the test script, not the feature**: the dev server
it was posting to stayed on plain ADC, and `createSessionCookie` is a REST call
that does not sign anything locally. Worth being clear about, because the
error, `Failed to determine service account`, reads like the feature is broken.

```
POST status 200 | set-cookie attrs: __session=<redacted>; Path=/; Max-Age=1209600; HttpOnly; SameSite=lax
verifySessionCookie -> { uid: 'e2e-session-smoke', email: null, displayName: null, photoUrl: null }
verifySessionCookie(garbage) -> null
DELETE status 200 | __session=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT
POST bad token status 401
cleaned up test user e2e-session-smoke
```

The first POST took 774 ms, the bad-token one about 200 ms. The test user was
deleted at the end of the script rather than left in the project's user list.

### Two things the run showed

The bad-token log line dumped the Admin SDK's whole error object: the HTTP
response, its headers, the parsed body, the cause and its response again.
Sixty lines for one invalid token. I had it log the code and the message and
nothing else: `Could not create a session cookie: auth/invalid-id-token The
provided ID token is not a valid Firebase ID token.`

And the header did not fit on a phone. At a 375 px viewport the document was
473 px wide. The logo alone measured 261 px, the menu button about 60, and the
new labelled button 90. Below the 600 px breakpoint the button is now the
icon on its own, which is the width the avatar takes once you are signed in;
after that the document was the viewport's width.

## What happened

- Lint, typecheck, the webapp's 152 Vitest tests (7 new, for the route handler
  and the session helper), 4 new Jest tests for the server module, and a
  production `next build` all passed.
- The server half is proven end to end against a running server on plain ADC,
  as above.
- Merging needed CI green under branch protection, auto-merge is disabled on
  the repo, and the `test` job took 7 min 17 s, so the merge waited on it.
- The popup itself, on the deployed site, was the one box left unchecked on
  the pull request. It needs a person's click.

## Where it landed

Google-only sign-in, a fourteen-day server session, and a `getSessionUser()`
any server component or route handler can call. Nothing about a user in the
database. The site sits behind basic auth while it is private; the session
route is a same-origin fetch, so the browser resends those credentials and
the two do not interact.

Open: sign-out clears the cookie and signs the browser out, but does not
revoke the account's refresh tokens, so there is no "sign out everywhere"
yet. The hourly re-mint is one Identity Toolkit call per signed-in browser per
hour, which is nothing at this size and was not measured at any other. And the
part that uses the identity for anything, preferences, alerts, a token for a
programmatic client, comes next.

## Links

- [Manage session cookies](https://firebase.google.com/docs/auth/admin/manage-cookies) — Firebase Admin SDK docs
- [Best practices for using signInWithRedirect on browsers that block third-party storage access](https://firebase.google.com/docs/auth/web/redirect-best-practices)
- [`cookies()` in the Next.js App Router](https://nextjs.org/docs/app/api-reference/functions/cookies) — why reading it makes a route dynamic
- [Route segment config](https://nextjs.org/docs/app/api-reference/file-conventions/route-segment-config) — the inheritance that keeps `force-dynamic` off the layout
- [`react-hooks/set-state-in-effect`](https://react.dev/reference/eslint-plugin-react-hooks/lints/set-state-in-effect) — the rule that improved the provider
- [`accounts:signInWithCustomToken`](https://firebase.google.com/docs/reference/rest/auth#section-verify-custom-token) — the REST call the smoke test used
