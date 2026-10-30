export const dynamic = "force-dynamic";
import { db } from "../../../../lib/db";
import { NextResponse } from "next/server";
import { esAdmin, noAutorizado } from "../../../../lib/adminAuth";
import { cambiarNombre } from "../../../../lib/alumnos";

// Cambia el nombre de un alumno (sus notas no se tocan)
export async function POST(request: Request) {
  if (!(await esAdmin())) return noAutorizado();

  try {
    const { id, fullName } = await request.json();
    if (!id) return NextResponse.json({ ok: false, error: "Falta el alumno" }, { status: 400 });
    const r = await cambiarNombre(db, String(id), String(fullName ?? ""));
    return NextResponse.json(r, { status: r.ok ? 200 : 400 });
  } catch (error) {
    console.error("Error al cambiar el nombre:", error);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
