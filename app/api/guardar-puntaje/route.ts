import { db } from "../../../lib/db";
import { scores } from "../../../lib/db/schema";
import { v4 as uuid } from "uuid";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const datos = await request.json();

    // Ver si hay un estudiante logueado (por la cookie)
    const cookieStore = await cookies();
    const studentId = cookieStore.get("student_id")?.value;

    // Si NO hay estudiante logueado (ej: feria), no guardamos nada, pero no es error
    if (!studentId) {
      return NextResponse.json({ ok: true, guardado: false });
    }

    // Guardar el puntaje asociado al estudiante
    await db.insert(scores).values({
      id: uuid(),
      quizId: datos.quizId || null,
      roundId: datos.roundId || null,
      playerName: studentId, // guardamos el id del estudiante acá
      score: datos.score,
      totalQuestions: datos.totalQuestions,
      correctAnswers: datos.correctAnswers,
      playedAt: new Date(),
    });

    return NextResponse.json({ ok: true, guardado: true });
  } catch (error) {
    console.error("Error al guardar puntaje:", error);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}