import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const AUTH_TOKEN_COOKIE = "crm_auth_token";
const USER_ROLE_COOKIE = "crm_user_role";

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get(AUTH_TOKEN_COOKIE)?.value;
  const role = request.cookies.get(USER_ROLE_COOKIE)?.value;

  const isLoginRoute = pathname === "/login";
  const isAdminRoute = pathname.startsWith("/admin");

  if (isLoginRoute) {
    return NextResponse.next();
  }

  if (!token) {
    const loginUrl = new URL("/login", request.url);
    return NextResponse.redirect(loginUrl);
  }

  const isKnownRole = role === "admin" || role === "sales_rep" || role === "sudo_admin";
  if (!isKnownRole) {
    const loginUrl = new URL("/login", request.url);
    return NextResponse.redirect(loginUrl);
  }

  if (isAdminRoute && role === "sales_rep") {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)"],
};
