import { NextRequest, NextResponse } from "next/server";

const PLATFORM_HOSTS = new Set([
  "restaurant-os-mvp.vercel.app",
  "www.restaurant-os-mvp.vercel.app",
  "localhost",
  "127.0.0.1",
]);

function normalizeHost(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/:\d+$/, "")
    .replace(/\.$/, "");
}

function isPlatformHost(host: string) {
  if (PLATFORM_HOSTS.has(host)) return true;
  if (host.endsWith(".vercel.app")) return true;
  return false;
}

function isSystemPath(pathname: string) {
  return (
    pathname.startsWith("/api/") ||
    pathname.startsWith("/_next/") ||
    pathname.startsWith("/favicon") ||
    pathname.startsWith("/robots.txt") ||
    pathname.startsWith("/sitemap") ||
    pathname.startsWith("/admin") ||
    pathname.startsWith("/owner") ||
    pathname.startsWith("/login") ||
    pathname.startsWith("/onboarding")
  );
}

export async function middleware(request: NextRequest) {
  const hostHeader =
    request.headers.get("x-forwarded-host") ||
    request.headers.get("host") ||
    "";

  const host = normalizeHost(hostHeader);
  const pathname = request.nextUrl.pathname;

  if (!host || isPlatformHost(host) || isSystemPath(pathname)) {
    return NextResponse.next();
  }

  // Prevent rewrite loops if the custom domain is already internally
  // serving a restaurant route.
  if (pathname.startsWith("/r/")) {
    return NextResponse.next();
  }

  try {
    const resolverUrl = new URL("/api/public/domain-resolve", request.url);
    resolverUrl.searchParams.set("host", host);

    const response = await fetch(resolverUrl, {
      headers: {
        "x-restaurant-os-middleware": "1",
      },
      cache: "no-store",
    });

    if (!response.ok) {
      return NextResponse.next();
    }

    const data = await response.json();

    if (
      !data?.found ||
      !data?.routable ||
      !data?.restaurant?.slug
    ) {
      return NextResponse.next();
    }

    const slug = String(data.restaurant.slug).trim();

    if (!slug) {
      return NextResponse.next();
    }

    const rewriteUrl = request.nextUrl.clone();

    // Root custom domain:
    // vi-pollo.com/  -> /r/vi-pollo
    //
    // Child paths:
    // vi-pollo.com/food-menu -> /r/vi-pollo/food-menu
    // vi-pollo.com/vip       -> /r/vi-pollo/vip
    // vi-pollo.com/offers    -> /r/vi-pollo/offers
    rewriteUrl.pathname =
      pathname === "/"
        ? `/r/${slug}`
        : `/r/${slug}${pathname}`;

    const responseOut = NextResponse.rewrite(rewriteUrl);

    responseOut.headers.set(
      "x-restaurant-os-domain",
      host
    );

    responseOut.headers.set(
      "x-restaurant-os-slug",
      slug
    );

    return responseOut;
  } catch {
    // Never take down a restaurant because the domain resolver has a transient
    // failure. If resolution fails, allow the request to continue normally.
    return NextResponse.next();
  }
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)",
  ],
};

