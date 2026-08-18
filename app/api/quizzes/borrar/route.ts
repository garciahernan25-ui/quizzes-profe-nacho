import { db } from "../../../../lib/db";
import { quizzes, rounds, questions } from "../../../../lib/db/schema";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { quizId } = await request.json();

    // Borrar las preguntas de cada sección del quiz
    const secciones = await db.select().from(rounds).where(eq(rounds.quizId, quizId));
    for (const seccion of secciones) {
      await db.delete(questions).where(eq(questions.roundId, seccion.id));
    }

    // Borrar las secciones
    await db.delete(rounds).where(eq(rounds.quizId, quizId));

    // Borrar el quiz
    await db.delete(quizzes).where(eq(quizzes.id, quizId));

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Error al borrar el quiz:", error);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}