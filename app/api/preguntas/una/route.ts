export const dynamic = "force-dynamic";

import { db } from "../../../../lib/db";
import { questions } from "../../../../lib/db/schema";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { id } = await request.json();
    const resultado = await db.select().from(questions).where(eq(questions.id, id));
    const pregunta = resultado[0];

    if (!pregunta) {
      return NextResponse.json({ ok: false }, { status: 404 });
    }

    return NextResponse.json({
      ok: true,
      pregunta: {
        id: pregunta.id,
        question: pregunta.question,
        questionImage: pregunta.questionImage || null,
        options: JSON.parse(pregunta.options),
        optionImages: pregunta.optionImages ? JSON.parse(pregunta.optionImages) : null,
        correctIndex: pregunta.correctIndex,
        explanation: pregunta.explanation || "",
      },
    });
  } catch (error) {
    console.error("Error al traer la pregunta:", error);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}