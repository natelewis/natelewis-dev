import type { Metadata } from "next";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Colophon",
  description:
    "How this site is built, how the posts are written, and what the AI does and does not do.",
};

export default function Colophon() {
  return (
    <div className="prose prose-neutral dark:prose-invert max-w-none">
      <h1>Colophon</h1>

      <h2>How the posts are written</h2>
      <p>
        Every post here is a record of real work: something I built or broke,
        what I tried, and what the numbers said. I do that work with AI coding
        agents, and the posts say so where it matters — what I asked the agent,
        what it came back with, where it was wrong and how I caught it.
      </p>
      <p>
        The posts are also <em>drafted</em> with an agent, from the session the
        work happened in. The agent gathers what happened; I decide what the
        post is about, what stays in, and whether it is worth publishing at all.
        Every number is one I measured, every claim is one I would make out
        loud, and I read the final draft as a stranger before it goes up. If
        something reads like a person wrote it, that is because one did the
        thinking. If something is wrong, that is on me, and I would like to
        know.
      </p>
      <p>
        The illustrations are generated from a scene I describe for each post,
        in one house style, with the same recurring character. He always wears a
        hat. That is a rule, not an accident.
      </p>

      <h2>How the site is built</h2>
      <p>
        Posts are Markdown files in a Git repository. A push to{" "}
        <code>main</code> builds a Next.js site into a container and deploys it
        to Google Cloud Run, which scales to zero when nobody is reading. Every
        page is rendered at build time; there is no database, no CMS, and
        nothing loads on the client that does not have to. Code is highlighted
        at build time too, so no JavaScript ships for it.
      </p>
      <p>
        The site is open on <a href={`${site.github}/natelewis-dev`}>GitHub</a>,
        including the scripts that scaffold a post, generate its banner, and
        check it for things that should not leave the machine.
      </p>

      <h2>What is collected</h2>
      <p>
        Google Analytics, for page views and referrers, so I can tell what
        people read. Nothing else: no comments, no accounts, no tracking across
        sites. The <a href="/rss.xml">RSS feed</a> carries full posts, so a feed
        reader never has to visit.
      </p>

      <h2>Reach me</h2>
      <p>
        <a href={site.github}>GitHub</a> · <a href={site.linkedin}>LinkedIn</a>
        {site.bluesky && (
          <>
            {" "}
            · <a href={site.bluesky}>Bluesky</a>
          </>
        )}
        {site.mastodon && (
          <>
            {" "}
            · <a href={site.mastodon}>Mastodon</a>
          </>
        )}
      </p>
    </div>
  );
}
