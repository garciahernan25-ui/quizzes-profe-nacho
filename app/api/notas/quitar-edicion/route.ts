export const dynamic = "force-dynamic";
import { db } from "../../../../lib/db";
import { NextResponse } from "next/server";
import { esAdmin, noAutorizado } from "../../../../lib/adminAuth";
import { quitarEdicion } from "../../../../lib/notasEditadas";

// Quita la nota editada a mano: vuelve a contar la mejor de los intentos
export async function POST(request: Request) {
  if (!(await esAdmin())) return noAutorizado();

  try {
    const { studentId, quizId } = await request.json();
    if (!studentId || !quizId) return NextResponse.json({ ok: false, error: "Falta el alumno o el quiz" }, { status: 400 });
    const r = await quitarEdicion(db, String(studentId), String(quizId));
    return NextResponse.json(r, { status: r.ok ? 200 : 400 });
  } catch (error) {
    console.error("Error al quitar la edición:", error);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
