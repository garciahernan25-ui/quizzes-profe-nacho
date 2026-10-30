export const dynamic = "force-dynamic";
import { db } from "../../../../lib/db";
import { NextResponse } from "next/server";
import { esAdmin, noAutorizado } from "../../../../lib/adminAuth";
import { aprobarCurso } from "../../../../lib/alumnos";

// Aprueba a todos los pendientes de un curso
export async function POST(request: Request) {
  if (!(await esAdmin())) return noAutorizado();

  try {
    const { courseId } = await request.json();
    if (!courseId) return NextResponse.json({ ok: false, error: "Falta el curso" }, { status: 400 });
    return NextResponse.json({ ok: true, aprobados: await aprobarCurso(db, String(courseId)) });
  } catch (error) {
    console.error("Error al aprobar el curso:", error);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
