import Link from "next/link";
import { TopicMarks } from "@/components/TopicMarks";
import { getPostsByKind } from "@/lib/posts";

export function Header() {
  // Notes appears once there is a published note to show, not as an empty page.
  const nav = [
    { href: "/", label: "Home" },
    { href: "/blog", label: "Blog" },
    ...(getPostsByKind("note").length ? [{ href: "/notes", label: "Notes" }] : []),
    { href: "/tags", label: "Tags" },
    { href: "/about", label: "About" },
  ];
  return (
    <header className="border-b border-border">
      <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-5">
        <TopicMarks />
        <nav className="flex gap-5 text-sm text-muted">
          {nav.map((n) => (
            <Link key={n.href} href={n.href} className="hover:text-foreground">
              {n.label}
            </Link>
          ))}
          <a href="/rss.xml" className="hover:text-foreground">
            RSS
          </a>
        </nav>
      </div>
    </header>
  );
}
