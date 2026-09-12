import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const { pathname } = req.nextUrl;
    const token = req.nextauth.token;

    // Jika user sudah login dan mencoba mengakses /login atau /register, redirect ke dashboard (/)
    if (token && (pathname === "/login" || pathname === "/register")) {
      return NextResponse.redirect(new URL("/", req.url));
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const { pathname } = req.nextUrl;

        // Rute publik yang bebas diakses tanpa login
        if (
          pathname.startsWith("/login") ||
          pathname.startsWith("/register") ||
          pathname.startsWith("/api/auth") ||
          pathname.startsWith("/api/register")
        ) {
          return true;
        }

        // Rute lainnya wajib memiliki token aktif
        return !!token;
      },
    },
    pages: {
      signIn: "/login",
    },
    secret: process.env.NEXTAUTH_SECRET || "b4d0d7Ht63Eb4h7gkPxyvhiYStXQzGjZNfkxT5zmjaY=",
  }
);

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - fonts (local fonts)
     */
    "/((?!_next/static|_next/image|favicon.ico|fonts).*)",
  ],
};
