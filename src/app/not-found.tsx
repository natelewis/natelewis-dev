import Link from "next/link";

export default function NotFound() {
  return (
    <div className="py-20 text-center">
      <h1 className="text-3xl font-bold tracking-tight">404</h1>
      <p className="mt-3 text-muted">That page doesn&apos;t exist.</p>
      <Link href="/" className="mt-6 inline-block text-accent hover:underline">
        ← Home
      </Link>
    </div>
  );
}
