import { cookies } from "next/headers";
import { NextResponse } from "next/server";

// Devuelve true solo si la cookie de admin tiene el valor secreto correcto
// (no alcanza con que la cookie exista: cualquiera podría inventarla)
export async function esAdmin() {
  const secreto = process.env.AUTH_SECRET;
  if (!secreto) return false;
  const cookieStore = await cookies();
  return cookieStore.get("admin_auth")?.value === secreto;
}

// Respuesta estándar para cuando alguien no logueado llama a una API de admin
export function noAutorizado() {
  return NextResponse.json({ ok: false, error: "No autorizado" }, { status: 401 });
}
