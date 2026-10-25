export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function POST(request: Request) {
  try {
    const { password } = await request.json();

    // Sin AUTH_SECRET no hay forma segura de recordar la sesión
    if (!process.env.AUTH_SECRET || !process.env.ADMIN_PASSWORD) {
      console.error("Faltan ADMIN_PASSWORD o AUTH_SECRET en las variables de entorno");
      return NextResponse.json({ ok: false, error: "Login de admin no configurado" }, { status: 500 });
    }

    if (password === process.env.ADMIN_PASSWORD) {
      // Contraseña correcta: guardamos una cookie que la "recuerda"
      const cookieStore = await cookies();
      cookieStore.set("admin_auth", process.env.AUTH_SECRET, {
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