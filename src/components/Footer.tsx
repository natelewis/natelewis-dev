import { site } from "@/lib/site";

export function Footer() {
  return (
    <footer className="mt-auto border-t border-border">
      <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-6 text-sm text-muted">
        <span>
          © {new Date().getFullYear()} {site.author}
        </span>
        <a href={site.github} className="hover:text-foreground">
          GitHub
        </a>
      </div>
    </footer>
  );
}
