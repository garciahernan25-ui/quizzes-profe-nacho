export const dynamic = "force-dynamic";
import { db } from "../../../../lib/db";
import { NextResponse } from "next/server";
import { esAdmin, noAutorizado } from "../../../../lib/adminAuth";
import { habilitarOtroIntento } from "../../../../lib/intentos";

// Le da a UN alumno UN intento más en UN quiz. Las notas anteriores se conservan (cuenta la mejor).
export async function POST(request: Request) {
  if (!(await esAdmin())) return noAutorizado();

  try {
    const { studentId, quizId } = await request.json();
    if (!studentId || !quizId) return NextResponse.json({ ok: false, error: "Falta el alumno o el quiz" }, { status: 400 });

    const r = await habilitarOtroIntento(db, studentId, quizId);
    return NextResponse.json(r, { status: r.ok ? 200 : 409 });
  } catch (error) {
    console.error("Error al habilitar otro intento:", error);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
