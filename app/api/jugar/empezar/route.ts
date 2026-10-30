export const dynamic = "force-dynamic";
import { db } from "../../../../lib/db";
import { NextResponse } from "next/server";
import { alumnoLogueado } from "../../../../lib/estudiante";
import { empezarOContinuar } from "../../../../lib/intentos";

// Empieza el quiz (o retoma el intento que quedó a medias). El servidor revisa si puede hacerlo.
export async function POST(request: Request) {
  const studentId = await alumnoLogueado();
  if (!studentId) return NextResponse.json({ tipo: "bloqueado", acceso: { tipo: "sin-cuenta" } }, { status: 401 });

  try {
    const { quizId } = await request.json();
    if (!quizId) return NextResponse.json({ tipo: "no-encontrado" }, { status: 400 });
    return NextResponse.json(await empezarOContinuar(db, studentId, quizId));
  } catch (error) {
    console.error("Error al empezar el quiz:", error);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
