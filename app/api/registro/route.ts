export const dynamic = "force-dynamic";
import { db } from "../../../lib/db";
import { NextResponse } from "next/server";
import { registrar } from "../../../lib/alumnos";

// El alumno nuevo queda "pendiente" hasta que el profe lo apruebe desde el panel
export async function POST(request: Request) {
  try {
    const r = await registrar(db, await request.json());
    if (!r.ok) return NextResponse.json({ ok: false, error: r.error }, { status: r.status });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Error en el registro:", error);
    return NextResponse.json({ ok: false, error: "No se pudo registrar" }, { status: 500 });
  }
}
