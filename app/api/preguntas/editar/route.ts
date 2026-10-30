export const dynamic = "force-dynamic";
import { db } from "../../../../lib/db";
import { questions, rounds } from "../../../../lib/db/schema";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { esAdmin, noAutorizado } from "../../../../lib/adminAuth";
import { vistaPreviaRecalculo } from "../../../../lib/notasEditadas";

export async function POST(request: Request) {
  if (!(await esAdmin())) return noAutorizado();

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

    // Si el quiz ya se jugó y cambió qué respuesta es la correcta, el panel ofrece recalcular las notas
    const seccion = (
      await db.select({ quizId: rounds.quizId }).from(questions).innerJoin(rounds, eq(questions.roundId, rounds.id)).where(eq(questions.id, datos.id))
    )[0];
    const recalculo = seccion?.quizId ? await vistaPreviaRecalculo(db, seccion.quizId) : null;

    return NextResponse.json({
      ok: true,
      quizId: seccion?.quizId ?? null,
      alumnosQueCambian: recalculo?.cambian.length ?? 0,
      respuestasQueCambian: recalculo?.respuestasQueCambian ?? 0,
    });
  } catch (error) {
    console.error("Error al editar la pregunta:", error);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}