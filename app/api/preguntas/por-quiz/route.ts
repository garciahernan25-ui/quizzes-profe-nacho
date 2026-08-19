export const dynamic = "force-dynamic";
import { db } from "../../../../lib/db";
import { questions, rounds } from "../../../../lib/db/schema";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { quizId } = await request.json();

    const secciones = await db.select().from(rounds).where(eq(rounds.quizId, quizId));

    const resultado = [];
    for (const seccion of secciones) {
      const preguntas = await db
        .select()
        .from(questions)
        .where(eq(questions.roundId, seccion.id));
      for (const p of preguntas) {
        resultado.push({
          id: p.id,
          question: p.question,
          seccion: seccion.name,
        });
      }
    }

    return NextResponse.json(resultado);
  } catch (error) {
    console.error("Error al listar preguntas del quiz:", error);
    return NextResponse.json([], { status: 500 });
  }
}