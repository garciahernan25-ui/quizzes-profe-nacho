export const dynamic = "force-dynamic";
import { db } from "../../../lib/db";
import { students, scores, rounds, quizzes, courses, schools, modalities } from "../../../lib/db/schema";
import { eq, ne } from "drizzle-orm";
import { NextResponse } from "next/server";
import { esAdmin, noAutorizado } from "../../../lib/adminAuth";
import { notaDePartida, notaDelQuiz, notaFinal, promedio } from "../../../lib/notas";
import { clave, edicionesVigentes } from "../../../lib/ediciones";

export async function GET() {
  if (!(await esAdmin())) return noAutorizado();

  try {
    // Los pendientes no aparecen hasta que el profe los aprueba (los bloqueados sí, con su marca)
    const alumnos = await db.select().from(students).where(ne(students.status, "pendiente"));
    const editadas = await edicionesVigentes(db);
    const listaQuizzes = await db.select({ id: quizzes.id, title: quizzes.title }).from(quizzes);

    // Notas del sistema anterior: una por sección jugada (el quiz se saca de la sección).
    // Notas nuevas: una por intento, con el quiz directo y attempt_id.
    const partidas = await db
      .select({
        studentId: scores.playerName,
        correctas: scores.correctAnswers,
        total: scores.totalQuestions,
        quizDirecto: scores.quizId,
        quizDeLaSeccion: rounds.quizId,
        attemptId: scores.attemptId,
      })
      .from(scores)
      .leftJoin(rounds, eq(scores.roundId, rounds.id));

    const cursos = await db
      .select({
        id: courses.id,
        name: courses.name,
        isActive: courses.isActive,
        schoolId: courses.schoolId,
        escuela: schools.name,
        modalidad: modalities.name,
      })
      .from(courses)
      .innerJoin(schools, eq(courses.schoolId, schools.id))
      .innerJoin(modalities, eq(schools.modalityId, modalities.id));

    const alumnosConDatos = alumnos.map((alumno) => {
      const suyas = partidas
        .filter((p) => p.studentId === alumno.id)
        .map((p) => ({ quizId: p.quizDeLaSeccion ?? p.quizDirecto, attemptId: p.attemptId, nota: notaDePartida(p.correctas, p.total) }));

      // Nota del alumno en cada quiz que hizo: la editada a mano si hay; si no, la mejor de sus intentos
      const porQuiz: Record<string, number> = {};
      const editadasDelAlumno: string[] = [];
      for (const q of listaQuizzes) {
        const editada = editadas.get(clave(alumno.id, q.id));
        const nota = notaFinal(notaDelQuiz(suyas.filter((p) => p.quizId === q.id)), editada?.grade);
        if (nota !== null) porQuiz[q.id] = nota;
        if (editada) editadasDelAlumno.push(q.id);
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
        bloqueado: alumno.status === "bloqueado",
        textoOriginal,
        editadas: editadasDelAlumno,
        cantQuizzes: Object.keys(porQuiz).length,
        promedio: promedio(Object.values(porQuiz)),
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
