import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const ruta = request.nextUrl.pathname;

  // La pantalla de login SÍ se puede ver sin estar logueada
  if (ruta === "/admin/login") {
    return NextResponse.next();
  }

  // Para cualquier otra ruta que empiece con /admin, pedimos la cookie
  if (ruta.startsWith("/admin")) {
    const cookie = request.cookies.get("admin_auth");
    if (!cookie) {
      // No está logueada: la mandamos al login
      return NextResponse.redirect(new URL("/admin/login", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};