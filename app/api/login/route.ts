export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function POST(request: Request) {
  try {
    const { password } = await request.json();

    if (password === process.env.ADMIN_PASSWORD) {
      // Contraseña correcta: guardamos una cookie que la "recuerda"
      const cookieStore = await cookies();
      cookieStore.set("admin_auth", process.env.AUTH_SECRET || "ok", {
        httpOnly: true,
        secure: false,
        maxAge: 60 * 60 * 24 * 7, // 7 días
        path: "/",
      });
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ ok: false, error: "Contraseña incorrecta" }, { status: 401 });
  } catch (error) {
    console.error("Error en login:", error);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}