import { getAllPosts, getPost } from "@/lib/posts";
import { site } from "@/lib/site";

export const dynamic = "force-static";

const escape = (s: string) =>
  s.replace(
    /[<>&'"]/g,
    (c) =>
      ({
        "<": "&lt;",
        ">": "&gt;",
        "&": "&amp;",
        "'": "&apos;",
        '"': "&quot;",
      })[c]!,
  );

/** Relative hrefs and srcs in the rendered post become absolute for feed readers. */
const absolutize = (html: string) =>
  html.replace(/(href|src)="\/(?!\/)/g, `$1="${site.url}/`);

export async function GET() {
  const posts = await Promise.all(getAllPosts().map((p) => getPost(p.slug)));
  const items = posts
    .filter((p) => p !== null)
    .map((p) => {
      const url = `${site.url}/blog/${p.slug}`;
      const banner = p.images ? `${site.url}${p.images.banner}` : null;
      const tldr = p.tldr.length
        ? `<p><strong>TL;DR</strong></p><ul>${p.tldr.map((t) => `<li>${escape(t)}</li>`).join("")}</ul>`
        : "";
      const body = `${banner ? `<p><img src="${banner}" alt="" width="1600" height="900" /></p>` : ""}${tldr}${absolutize(p.html)}`;
      return `
    <item>
      <title>${escape(p.title)}</title>
      <link>${url}</link>
      <guid isPermaLink="true">${url}</guid>
      <pubDate>${new Date(`${p.date}T00:00:00Z`).toUTCString()}</pubDate>
      <dc:creator>${escape(site.author)}</dc:creator>
      ${p.tags.map((t) => `<category>${escape(t)}</category>`).join("")}
      <description>${escape(p.description)}</description>
      <content:encoded><![CDATA[${body}]]></content:encoded>${
        banner
          ? `\n      <media:content url="${banner}" medium="image" width="1600" height="900" />`
          : ""
      }
    </item>`;
    })
    .join("");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0"
  xmlns:atom="http://www.w3.org/2005/Atom"
  xmlns:content="http://purl.org/rss/1.0/modules/content/"
  xmlns:dc="http://purl.org/dc/elements/1.1/"
  xmlns:media="http://search.yahoo.com/mrss/">
  <channel>
    <title>${escape(site.title)}</title>
    <link>${site.url}</link>
    <description>${escape(site.description)}</description>
    <language>en-us</language>
    <image>
      <url>${site.url}/avatar.webp</url>
      <title>${escape(site.title)}</title>
      <link>${site.url}</link>
    </image>
    <atom:link href="${site.url}/rss.xml" rel="self" type="application/rss+xml" />${items}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: { "Content-Type": "application/rss+xml; charset=utf-8" },
  });
}
