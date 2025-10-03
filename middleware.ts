import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(req: NextRequest) {
  const isAdmin = req.nextUrl.pathname.startsWith("/admin");

  const requestHeaders = new Headers(req.headers);
  requestHeaders.set("x-is-admin", isAdmin ? "1" : "0");

  const res = NextResponse.next({ request: { headers: requestHeaders } });

  if (isAdmin) {
    res.cookies.set("is-admin", "1", { path: "/" });
  } else {
    res.cookies.delete("is-admin");
  }

  if (req.nextUrl.pathname.startsWith('/api')) {
    res.headers.set('Access-Control-Allow-Origin', '*');
    res.headers.set('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
    res.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
      return new NextResponse(null, { status: 204, headers: res.headers });
    }
  }

  return res;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)).*)",
  ],
};
