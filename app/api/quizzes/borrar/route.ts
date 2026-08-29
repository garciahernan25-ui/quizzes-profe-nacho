export const dynamic = "force-dynamic";
import { db } from "../../../../lib/db";
import { quizzes, rounds, questions, scores } from "../../../../lib/db/schema";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { quizId } = await request.json();

    const secciones = await db.select().from(rounds).where(eq(rounds.quizId, quizId));

    // Borrar dependencias de cada sección: puntajes y preguntas.
    // Los scores tienen FK a rounds (ON DELETE no action), así que hay que
    // borrarlos antes o el borrado de la ronda falla por foreign key.
    for (const seccion of secciones) {
      await db.delete(scores).where(eq(scores.roundId, seccion.id));
      await db.delete(questions).where(eq(questions.roundId, seccion.id));
    }

    // Borrar también los scores que referencian directamente al quiz.
    await db.delete(scores).where(eq(scores.quizId, quizId));

    // Borrar las secciones
    await db.delete(rounds).where(eq(rounds.quizId, quizId));

    // Borrar el quiz
    await db.delete(quizzes).where(eq(quizzes.id, quizId));

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Error al borrar el quiz:", error);
    const message = error instanceof Error ? error.message : "Error desconocido";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}