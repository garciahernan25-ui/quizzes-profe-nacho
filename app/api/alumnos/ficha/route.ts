export const dynamic = "force-dynamic";
import { db } from "../../../../lib/db";
import { NextResponse } from "next/server";
import { esAdmin, noAutorizado } from "../../../../lib/adminAuth";
import { fichaDelAlumno } from "../../../../lib/intentos";

// Todos los quizzes de un alumno con nota, puntos, fecha y duración de cada intento
export async function GET(request: Request) {
  if (!(await esAdmin())) return noAutorizado();

  try {
    const id = new URL(request.url).searchParams.get("id") ?? "";
    const ficha = await fichaDelAlumno(db, id);
    if (!ficha) return NextResponse.json({ ok: false, error: "No existe el alumno" }, { status: 404 });
    return NextResponse.json(ficha);
  } catch (error) {
    console.error("Error al armar la ficha del alumno:", error);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
