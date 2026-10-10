import { site } from "@/lib/site";

/** The site's author, as every page's structured data names them. */
export const person = {
  "@type": "Person",
  name: site.author,
  url: site.url,
  sameAs: [site.github, site.linkedin].filter(Boolean),
};

/** One schema.org object as a script tag; `<` escaped so the data cannot close it. */
export function JsonLd({ data }: { data: Record<string, unknown> }) {
  const json = JSON.stringify({
    "@context": "https://schema.org",
    ...data,
  }).replace(/</g, "\\u003c");
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: json }}
    />
  );
}
