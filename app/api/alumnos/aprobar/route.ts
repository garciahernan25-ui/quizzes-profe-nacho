export const dynamic = "force-dynamic";
import { db } from "../../../../lib/db";
import { NextResponse } from "next/server";
import { esAdmin, noAutorizado } from "../../../../lib/adminAuth";
import { aprobar } from "../../../../lib/alumnos";

// Aprueba a un alumno pendiente. Si viene fullName, le corrige el nombre antes.
export async function POST(request: Request) {
  if (!(await esAdmin())) return noAutorizado();

  try {
    const { id, fullName } = await request.json();
    if (!id) return NextResponse.json({ ok: false, error: "Falta el alumno" }, { status: 400 });
    const r = await aprobar(db, String(id), fullName === undefined ? undefined : String(fullName));
    return NextResponse.json(r, { status: r.ok ? 200 : 400 });
  } catch (error) {
    console.error("Error al aprobar al alumno:", error);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
