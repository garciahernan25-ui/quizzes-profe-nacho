export const dynamic = "force-dynamic";
import { db } from "../../../lib/db";
import { students, scores, rounds, quizzes, courses, schools, modalities } from "../../../lib/db/schema";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { esAdmin, noAutorizado } from "../../../lib/adminAuth";
import { notaDePartida, promedio } from "../../../lib/notas";

export async function GET() {
  if (!(await esAdmin())) return noAutorizado();

  try {
    const alumnos = await db.select().from(students);
    const listaQuizzes = await db.select({ id: quizzes.id, title: quizzes.title }).from(quizzes);

    // Cada partida es una sección jugada. El quiz se saca de la sección
    // (las partidas se guardan con quiz_id vacío).
    const partidas = await db
      .select({
        studentId: scores.playerName,
        correctas: scores.correctAnswers,
        total: scores.totalQuestions,
        quizDirecto: scores.quizId,
        quizDeLaSeccion: rounds.quizId,
      })
      .from(scores)
      .leftJoin(rounds, eq(scores.roundId, rounds.id));

    const cursos = await db
      .select({
        id: courses.id,
        name: courses.name,
        isActive: courses.isActive,
        escuela: schools.name,
        modalidad: modalities.name,
      })
      .from(courses)
      .innerJoin(schools, eq(courses.schoolId, schools.id))
      .innerJoin(modalities, eq(schools.modalityId, modalities.id));

    const alumnosConDatos = alumnos.map((alumno) => {
      const suyas = partidas
        .filter((p) => p.studentId === alumno.id)
        .map((p) => ({ quizId: p.quizDeLaSeccion ?? p.quizDirecto, nota: notaDePartida(p.correctas, p.total) }));

      // Promedio del alumno en cada quiz que jugó
      const porQuiz: Record<string, number> = {};
      for (const q of listaQuizzes) {
        const prom = promedio(suyas.filter((p) => p.quizId === q.id).map((p) => p.nota));
        if (prom !== null) porQuiz[q.id] = prom;
      }

      // Lo que escribió al registrarse (sirve para saber a qué curso asignarlo)
      const textoOriginal = [alumno.modality, alumno.school, alumno.extraInfo, [alumno.year, alumno.division].filter(Boolean).join(" ")]
        .filter(Boolean)
        .join(" · ");

      return {
        id: alumno.id,
        fullName: alumno.fullName,
        username: alumno.username,
        courseId: alumno.courseId,
        textoOriginal,
        cantPartidas: suyas.length,
        promedio: promedio(suyas.map((p) => p.nota)),
        porQuiz,
      };
    });

    const orden = (a: string, b: string) => a.localeCompare(b, "es", { numeric: true });
    cursos.sort((a, b) => orden(a.modalidad, b.modalidad) || orden(a.escuela, b.escuela) || orden(a.name, b.name));
    listaQuizzes.sort((a, b) => orden(a.title, b.title));

    return NextResponse.json({ alumnos: alumnosConDatos, cursos, quizzes: listaQuizzes });
  } catch (error) {
    console.error("Error en seguimiento:", error);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
