export const dynamic = "force-dynamic";
import { db } from "../../../../lib/db";
import { NextResponse } from "next/server";
import { esAdmin, noAutorizado } from "../../../../lib/adminAuth";
import { editarNota } from "../../../../lib/notasEditadas";
import { leerNota } from "../../../../lib/notas";

// Cambia a mano la nota de un alumno en un quiz. Queda registrado quién, cuándo y cuál era la nota.
export async function POST(request: Request) {
  if (!(await esAdmin())) return noAutorizado();

  try {
    const { studentId, quizId, nota } = await request.json();
    if (!studentId || !quizId) return NextResponse.json({ ok: false, error: "Falta el alumno o el quiz" }, { status: 400 });
    const valor = leerNota(String(nota ?? ""));
    if (valor === null) return NextResponse.json({ ok: false, error: "La nota tiene que ser un número de 0 a 10." }, { status: 400 });
    const r = await editarNota(db, String(studentId), String(quizId), valor);
    return NextResponse.json(r, { status: r.ok ? 200 : 400 });
  } catch (error) {
    console.error("Error al editar la nota:", error);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
