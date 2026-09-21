import Link from "next/link";
import { site } from "@/lib/site";

export function Footer() {
  return (
    <footer className="mt-auto border-t border-border">
      <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-6 text-sm text-muted">
        <span className="flex gap-4">
          <span>
            © {new Date().getFullYear()} {site.author}
          </span>
          <Link href="/colophon" className="hover:text-foreground">
            Colophon
          </Link>
        </span>
        <span className="flex gap-4">
          <a href={site.github} className="hover:text-foreground">
            GitHub
          </a>
          {site.bluesky && (
            <a href={site.bluesky} className="hover:text-foreground" rel="me">
              Bluesky
            </a>
          )}
          {site.mastodon && (
            <a href={site.mastodon} className="hover:text-foreground" rel="me">
              Mastodon
            </a>
          )}
          <a href={site.linkedin} className="hover:text-foreground">
            LinkedIn
          </a>
          <a href="/rss.xml" className="hover:text-foreground">
            RSS
          </a>
        </span>
      </div>
    </footer>
  );
}
