import { NextResponse, type NextRequest } from "next/server";

const CANONICAL_HOST = "natelewis.dev";

/** Send www.natelewis.dev to the bare domain so there's one canonical URL. */
export function proxy(request: NextRequest) {
  const host = request.headers.get("host") ?? "";
  if (host === `www.${CANONICAL_HOST}`) {
    const url = request.nextUrl.clone();
    url.host = CANONICAL_HOST;
    url.port = "";
    url.protocol = "https:";
    return NextResponse.redirect(url, 308);
  }
  return NextResponse.next();
}

export const config = {
  // Skip static assets; everything else gets the host check.
  matcher: ["/((?!_next/static|_next/image|.*\\.(?:png|webp|svg|ico|jpg)$).*)"],
};
