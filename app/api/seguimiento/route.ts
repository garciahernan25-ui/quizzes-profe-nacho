export const dynamic = "force-dynamic";
import { db } from "../../../lib/db";
import { students, scores } from "../../../lib/db/schema";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const alumnos = await db.select().from(students);
    const todosPuntajes = await db.select().from(scores);

    // Para cada alumno, calcular cantidad de quizzes y promedio %
    const alumnosConDatos = alumnos.map((alumno) => {
      // Los puntajes de este alumno (guardamos su id en playerName)
      const suyos = todosPuntajes.filter((s) => s.playerName === alumno.id);

      let promedio = 0;
      if (suyos.length > 0) {
        // % de cada partida = correctas / total * 100
        const suma = suyos.reduce((acc, s) => {
          const pct = s.totalQuestions > 0 ? (s.correctAnswers / s.totalQuestions) * 100 : 0;
          return acc + pct;
        }, 0);
        promedio = Math.round(suma / suyos.length);
      }

      return {
        id: alumno.id,
        fullName: alumno.fullName,
        modality: alumno.modality,
        school: alumno.school,
        year: alumno.year,
        division: alumno.division,
        extraInfo: alumno.extraInfo,
        cantQuizzes: suyos.length,
        promedio,
      };
    });

    return NextResponse.json(alumnosConDatos);
  } catch (error) {
    console.error("Error en seguimiento:", error);
    return NextResponse.json([], { status: 500 });
  }
}