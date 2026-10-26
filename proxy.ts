import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Primer filtro para las pantallas de /admin. La protección de verdad está
// en cada API (lib/adminAuth.ts), porque el proxy solo cuida las páginas.
export function proxy(request: NextRequest) {
  const ruta = request.nextUrl.pathname;

  // La pantalla de login SÍ se puede ver sin estar logueada
  if (ruta === "/admin/login") {
    return NextResponse.next();
  }

  // Para cualquier otra ruta que empiece con /admin, pedimos la cookie con el valor correcto
  if (ruta.startsWith("/admin")) {
    const cookie = request.cookies.get("admin_auth");
    const secreto = process.env.AUTH_SECRET;
    if (!secreto || cookie?.value !== secreto) {
      // No está logueada: la mandamos al login
      return NextResponse.redirect(new URL("/admin/login", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
