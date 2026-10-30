export const dynamic = "force-dynamic";
import { db } from "../../../lib/db";
import { NextResponse } from "next/server";
import { alumnoLogueado } from "../../../lib/estudiante";
import { estadoDelAlumno } from "../../../lib/alumnos";

// La pantalla de "esperando aprobación" pregunta acá cada pocos segundos
export async function GET() {
  const studentId = await alumnoLogueado();
  if (!studentId) return NextResponse.json({ status: "no-existe" }, { headers: { "Cache-Control": "no-store" } });

  try {
    return NextResponse.json({ status: await estadoDelAlumno(db, studentId) }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("Error al leer el estado del alumno:", error);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
