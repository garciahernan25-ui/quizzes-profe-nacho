export const dynamic = "force-dynamic";
import { db } from "../../../lib/db";
import { students, scores } from "../../../lib/db/schema";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const alumnos = await db.select().from(students);
    const todosPuntajes = await db.select().from(scores);

    const alumnosConDatos = alumnos.map((alumno) => {
      const suyos = todosPuntajes.filter((s) => s.playerName === alumno.id);

      let promedio = 0;
      if (suyos.length > 0) {
        // Nota de cada partida = (correctas / total) * 10
        const sumaNotas = suyos.reduce((acc, s) => {
          const nota = s.totalQuestions > 0 ? (s.correctAnswers / s.totalQuestions) * 10 : 0;
          return acc + nota;
        }, 0);
        promedio = Math.round((sumaNotas / suyos.length) * 10) / 10; // redondeo a 1 decimal
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