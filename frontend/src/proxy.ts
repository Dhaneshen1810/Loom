import { NextRequest, NextResponse } from "next/server";

import { isTokenActive, SESSION_COOKIE } from "@/lib/auth";

const AUTH_PAGES = new Set(["/login", "/register"]);

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  const hasSession = isTokenActive(token);

  if (AUTH_PAGES.has(pathname) && hasSession) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  if (pathname === "/" && !hasSession) {
    const response = NextResponse.redirect(new URL("/login", request.url));

    if (token) {
      response.cookies.delete(SESSION_COOKIE);
    }

    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/", "/login", "/register"],
};
