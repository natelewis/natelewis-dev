import type { Metadata } from "next";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "About",
  description: `About ${site.name} — ${site.tagline}.`,
};

const links = [
  { href: site.github, label: "GitHub" },
  { href: site.linkedin, label: "LinkedIn" },
];

export default function About() {
  return (
    <>
      <header className="mb-10 border-l-2 border-accent pl-4">
        <h1 className="text-3xl font-bold tracking-tight">{site.name}</h1>
        <p className="mt-1 text-muted">{site.tagline}</p>
        <p className="mt-3 flex gap-4 text-sm">
          {links.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="text-accent hover:underline"
              rel="me"
            >
              {l.label}
            </a>
          ))}
        </p>
      </header>

      <div className="prose prose-neutral dark:prose-invert max-w-none">
        <p>
          Hi, I&apos;m Nate. I&apos;m a senior full-stack engineer outside
          Boston, and I think the biggest leverage in software right now comes
          from combining human craftsmanship with agentic tooling. I build
          across the whole stack and I care more about clarity and a sturdy
          architecture than about being clever. Most of what I write here is
          about that combination: pushing on what a modern workflow can do
          while staying rooted in principles that were true before any of
          these tools existed.
        </p>

        <p>
          I&apos;ve been building for the web since 1995. For nineteen of those
          years I ran gNetworks, a boutique shop doing content management,
          eCommerce, and social for everyone from home-based businesses to
          Fortune 500 companies. The centerpiece was{" "}
          <a href="https://github.com/natelewis/FWS-V2">Framework Sites</a>, an
          open-source Perl CMS I wrote so that a customer could install it on
          whatever shared host they already had and it would just work. That
          constraint taught me most of what I still believe about engineering:
          ship the thing that runs everywhere, only depend on what you can
          vouch for, and make upgrades boring. I&apos;ve since spent years in
          larger engineering orgs, leading teams and working deep in the
          stack, but that&apos;s the era that shaped how I think.
        </p>

        <p>
          The AI thread runs further back than the current wave. I ported{" "}
          <a href="https://github.com/natelewis/eliza-as-promised">ELIZA to Node</a>,
          gave it a voice with the Google Speech API, and then spent a couple of
          years on{" "}
          <a href="https://github.com/natelewis/edwin-the-assistant">Edwin</a>,
          an extensible assistant platform that talked through Google Home,
          Slack, and Hangouts and could turn down the Sonos when asked nicely.
          Edwin was hand-built intent parsing and a lot of JSON. Watching what
          a modern model does with the same problem in one prompt is a big part
          of why I find this moment so much fun.
        </p>

        <p>
          These days that means TypeScript and React on the front, LLMs and
          agents behind them, MCP servers for things that were never meant to
          have an API, and the unglamorous plumbing that turns a demo into
          something that runs every day. This site is one of those: Markdown in
          a repo, a container on Cloud Run, and a push to <code>main</code> to
          publish.
        </p>

        <p>
          Away from the keyboard I make music, host karaoke, and put LED strips
          on things that probably didn&apos;t need them. For a few years I also
          co-ran Geek Aid, an outdoor music and art festival that raised money
          for art and technology scholarships, which is still one of my
          favorite things I&apos;ve been part of.
        </p>
      </div>
    </>
  );
}
