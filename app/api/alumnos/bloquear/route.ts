export const dynamic = "force-dynamic";
import { db } from "../../../../lib/db";
import { NextResponse } from "next/server";
import { esAdmin, noAutorizado } from "../../../../lib/adminAuth";
import { bloquear } from "../../../../lib/alumnos";

// Bloquea o desbloquea a un alumno aprobado. Sus notas se conservan.
export async function POST(request: Request) {
  if (!(await esAdmin())) return noAutorizado();

  try {
    const { id, bloqueado } = await request.json();
    if (!id || typeof bloqueado !== "boolean") return NextResponse.json({ ok: false, error: "Faltan datos" }, { status: 400 });
    const r = await bloquear(db, String(id), bloqueado);
    return NextResponse.json(r, { status: r.ok ? 200 : 400 });
  } catch (error) {
    console.error("Error al bloquear al alumno:", error);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
