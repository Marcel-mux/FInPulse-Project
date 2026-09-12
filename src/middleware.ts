import { withAuth, NextRequestWithAuth } from "next-auth/middleware";
import { NextFetchEvent, NextRequest, NextResponse } from "next/server";

const authMiddleware = withAuth(
  function middleware(req: NextRequestWithAuth) {
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
          pathname.startsWith("/api/register") ||
          pathname.startsWith("/api/webhook")
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

export default function middleware(req: NextRequest, event: NextFetchEvent) {
  const { pathname } = req.nextUrl;

  // Bypass autentikasi sepenuhnya untuk rute webhook eksternal (WhatsApp, dll)
  if (pathname.startsWith("/api/webhook")) {
    return NextResponse.next();
  }

  return authMiddleware(req as NextRequestWithAuth, event);
}

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
