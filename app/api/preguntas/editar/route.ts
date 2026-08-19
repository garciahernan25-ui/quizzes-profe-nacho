export const dynamic = "force-dynamic";
import { db } from "../../../../lib/db";
import { questions } from "../../../../lib/db/schema";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const datos = await request.json();

    await db
      .update(questions)
      .set({
        question: datos.question,
        questionImage: datos.questionImage || null,
        options: JSON.stringify(datos.options),
        optionImages: datos.optionImages ? JSON.stringify(datos.optionImages) : null,
        correctIndex: datos.correctIndex,
        explanation: datos.explanation || null,
      })
      .where(eq(questions.id, datos.id));

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Error al editar la pregunta:", error);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}