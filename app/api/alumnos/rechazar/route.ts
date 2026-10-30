export const dynamic = "force-dynamic";
import { db } from "../../../../lib/db";
import { NextResponse } from "next/server";
import { esAdmin, noAutorizado } from "../../../../lib/adminAuth";
import { rechazar } from "../../../../lib/alumnos";

// Rechaza a un pendiente: se borra su registro y puede volver a registrarse
export async function POST(request: Request) {
  if (!(await esAdmin())) return noAutorizado();

  try {
    const { id } = await request.json();
    if (!id) return NextResponse.json({ ok: false, error: "Falta el alumno" }, { status: 400 });
    const r = await rechazar(db, String(id));
    return NextResponse.json(r, { status: r.ok ? 200 : 400 });
  } catch (error) {
    console.error("Error al rechazar al alumno:", error);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
