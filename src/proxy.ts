import NextAuth from "next-auth";
import { authConfig } from "@/auth.config";
import { NextResponse } from "next/server";

// Use the edge-safe config (no Prisma, no native addons).
const { auth } = NextAuth(authConfig);

// Public routes that never require a session.
const PUBLIC_ROUTES = ["/login", "/register", "/unauthorized"];

// Route prefixes that require an elevated role (everything except plain USER).
const ADMIN_AREA = [
  "/customers",
  "/users",
  "/reports",
  "/analytics",
  "/sales",
];

export default auth((req) => {
  const { nextUrl } = req;
  const path = nextUrl.pathname;
  const session = req.auth;
  const role = session?.user?.role;
  const isLoggedIn = !!session;

  const isPublic = PUBLIC_ROUTES.some(
    (p) => path === p || path.startsWith(`${p}/`),
  );

  // Landing: send authed users to the app, others to login.
  if (path === "/") {
    return NextResponse.redirect(
      new URL(isLoggedIn ? "/calls" : "/login", nextUrl),
    );
  }

  // Bounce logged-in users away from auth pages.
  if (isPublic) {
    if (isLoggedIn && (path === "/login" || path === "/register")) {
      return NextResponse.redirect(new URL("/calls", nextUrl));
    }
    return NextResponse.next();
  }

  // Everything else requires a session.
  if (!isLoggedIn) {
    const url = new URL("/login", nextUrl);
    url.searchParams.set("callbackUrl", path + nextUrl.search);
    return NextResponse.redirect(url);
  }

  // Role gating for admin-area sections.
  const inAdminArea = ADMIN_AREA.some(
    (p) => path === p || path.startsWith(`${p}/`),
  );
  if (inAdminArea && role === "USER") {
    return NextResponse.redirect(new URL("/unauthorized", nextUrl));
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
