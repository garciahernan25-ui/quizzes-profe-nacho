import { db } from "../../../lib/db";
import { questions } from "../../../lib/db/schema";
import { eq } from "drizzle-orm";
import { v4 as uuid } from "uuid";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const datos = await request.json();

    const existentes = await db
      .select()
      .from(questions)
      .where(eq(questions.roundId, datos.roundId));

    await db.insert(questions).values({
      id: uuid(),
      roundId: datos.roundId,
      question: datos.question,
      questionImage: datos.questionImage || null,
      options: JSON.stringify(datos.options),
      optionImages: datos.optionImages ? JSON.stringify(datos.optionImages) : null,
      correctIndex: datos.correctIndex,
      explanation: datos.explanation || null,
      order: existentes.length,
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Error al guardar la pregunta:", error);
    return NextResponse.json({ ok: false, error: "No se pudo guardar" }, { status: 500 });
  }
}