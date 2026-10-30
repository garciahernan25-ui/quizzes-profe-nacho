export const dynamic = "force-dynamic";
import { db } from "../../../../lib/db";
import { NextResponse } from "next/server";
import { esAdmin, noAutorizado } from "../../../../lib/adminAuth";
import { borrarNota } from "../../../../lib/intentos";

// Borra los resultados de UN alumno en UN quiz. Después puede volver a hacerlo.
export async function POST(request: Request) {
  if (!(await esAdmin())) return noAutorizado();

  try {
    const { studentId, quizId } = await request.json();
    if (!studentId || !quizId) return NextResponse.json({ ok: false, error: "Falta el alumno o el quiz" }, { status: 400 });

    await borrarNota(db, studentId, quizId);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Error al borrar la nota:", error);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
