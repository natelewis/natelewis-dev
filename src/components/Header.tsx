import Link from "next/link";
import { TopicMarks } from "@/components/TopicMarks";

const nav = [
  { href: "/", label: "Home" },
  { href: "/blog", label: "Blog" },
  { href: "/notes", label: "Notes" },
  { href: "/tags", label: "Tags" },
  { href: "/about", label: "About" },
];

export function Header() {
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
