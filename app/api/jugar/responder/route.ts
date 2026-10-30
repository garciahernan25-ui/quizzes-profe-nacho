export const dynamic = "force-dynamic";
import { db } from "../../../../lib/db";
import { NextResponse } from "next/server";
import { alumnoLogueado } from "../../../../lib/estudiante";
import { responder } from "../../../../lib/intentos";

// El alumno manda qué opción eligió (null = se le acabó el tiempo). El servidor mide el tiempo y corrige.
export async function POST(request: Request) {
  const studentId = await alumnoLogueado();
  if (!studentId) return NextResponse.json({ tipo: "no-encontrado" }, { status: 401 });

  try {
    const { intentoId, elegida } = await request.json();
    const opcion = Number.isInteger(elegida) ? (elegida as number) : null;
    return NextResponse.json(await responder(db, studentId, String(intentoId), opcion));
  } catch (error) {
    console.error("Error al responder:", error);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
