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
          I&apos;ve been building for the web since 1995. For most of the first
          two decades that meant running my own shop, gNetworks, where I built
          content management, eCommerce, and community sites for businesses of
          every size. Running a small company means you are the whole stack:
          the person who designs it, writes it, deploys it, and picks up the
          phone when it breaks. That&apos;s where most of my instincts about
          software come from.
        </p>

        <p>
          Since then I&apos;ve worked in larger engineering organizations,
          leading teams and building products that a lot of people depend on.
          Different scale, same job: keep things clear, keep them sturdy, and
          resist being clever when simple will do.
        </p>

        <p>
          I&apos;ve been tinkering with conversational software and
          hand-rolled assistants for a long time, well before the current
          wave, so watching what today&apos;s models and agents can do feels
          less like a new field and more like the tools finally catching up
          to the idea. That&apos;s what most of this site is about: agentic
          development, the workflows that actually hold up, and the plumbing
          that turns a demo into something that runs every day.
        </p>

        <p>
          Away from the keyboard I make music, sing karaoke, and put LED strips
          on things that didn&apos;t need them.
        </p>
      </div>
    </>
  );
}
