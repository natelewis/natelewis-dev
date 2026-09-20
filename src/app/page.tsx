import Link from "next/link";
import { PostList } from "@/components/PostList";
import { getAllPosts } from "@/lib/posts";
import { site } from "@/lib/site";

export default function Home() {
  const posts = getAllPosts().slice(0, 5);
  return (
    <>
      <section className="mb-12">
        <h1 className="text-3xl font-bold tracking-tight">{site.name}</h1>
        <p className="mt-1 text-muted">{site.tagline}</p>
        <p className="mt-4 text-lg">{site.description}</p>
      </section>
      <section>
        <div className="mb-6 flex items-baseline justify-between">
          <h2 className="text-xl font-semibold">Recent posts</h2>
          <Link href="/blog" className="text-sm text-muted hover:text-foreground">
            All posts →
          </Link>
        </div>
        <PostList posts={posts} />
      </section>
    </>
  );
}
