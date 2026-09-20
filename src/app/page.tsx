import Image from "next/image";
import avatar from "../../public/avatar.webp";
import Link from "next/link";
import { PostList } from "@/components/PostList";
import { getAllPosts } from "@/lib/posts";
import { site } from "@/lib/site";

export default function Home() {
  const posts = getAllPosts().slice(0, 5);
  return (
    <>
      <section className="mb-12 flex items-start gap-6">
        <Image
          // A static import gets a content-hashed URL, so a new picture is a new URL
          // and no browser keeps showing the old one.
          src={avatar}
          alt=""
          width={128}
          height={128}
          priority
          className="shrink-0 rounded-lg object-cover"
        />
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{site.name}</h1>
          <p className="mt-1 text-muted">{site.tagline}</p>
          <p className="mt-4 text-lg">{site.description}</p>
        </div>
      </section>
      <section>
        <div className="mb-6 flex items-baseline justify-between">
          <h2 className="text-xl font-semibold">Recent posts</h2>
          <Link
            href="/blog"
            className="text-sm text-muted hover:text-foreground"
          >
            All posts →
          </Link>
        </div>
        <PostList posts={posts} />
      </section>
    </>
  );
}
