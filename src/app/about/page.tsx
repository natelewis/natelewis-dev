import type { Metadata } from "next";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "About",
};

export default function About() {
  return (
    <div className="prose prose-neutral dark:prose-invert">
      <h1>About</h1>
      <p>
        I&apos;m {site.name}. This is where I write about software, data, and
        the things I&apos;m building.
      </p>
      <p>
        Find me on <a href={site.github}>GitHub</a>.
      </p>
    </div>
  );
}
