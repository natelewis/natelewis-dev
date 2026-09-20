import { site } from "@/lib/site";

export function Footer() {
  return (
    <footer className="mt-auto border-t border-border">
      <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-6 text-sm text-muted">
        <span>
          © {new Date().getFullYear()} {site.author}
        </span>
        <span className="flex gap-4">
          <a href={site.github} className="hover:text-foreground">
            GitHub
          </a>
          <a href={site.linkedin} className="hover:text-foreground">
            LinkedIn
          </a>
        </span>
      </div>
    </footer>
  );
}
