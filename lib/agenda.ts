// Notas que lee la Agenda docente (otra app del profe) para pasarlas a su planilla.
// Usa las mismas reglas que el seguimiento: la editada a mano si hay; si no, la mejor de los intentos.
import { timingSafeEqual } from "node:crypto";
import { eq, ne } from "drizzle-orm";
import * as schema from "./db/schema";
import type { DB } from "./intentos";
import { clave, edicionesVigentes } from "./ediciones";
import { notaDePartida, notaDelQuiz, notaFinal } from "./notas";

const { students, scores, rounds, quizzes, courses, schools, modalities } = schema;

// La agenda manda "Authorization: Bearer <AGENDA_TOKEN>". Sin AGENDA_TOKEN configurado, no entra nadie.
export function tokenAgendaValido(encabezado: string | null, esperado = process.env.AGENDA_TOKEN) {
  if (!esperado || esperado.length < 32 || !encabezado?.startsWith("Bearer ")) return false;
  const a = Buffer.from(encabezado.slice(7).trim());
  const b = Buffer.from(esperado);
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function notasParaAgenda(db: DB) {
  const [alumnos, editadas, listaQuizzes, partidas, cursos] = await Promise.all([
    db.select().from(students).where(ne(students.status, "pendiente")),
    edicionesVigentes(db),
    db.select({ id: quizzes.id, title: quizzes.title }).from(quizzes),
    db
      .select({
        studentId: scores.playerName,
        correctas: scores.correctAnswers,
        total: scores.totalQuestions,
        quizDirecto: scores.quizId,
        quizDeLaSeccion: rounds.quizId,
        attemptId: scores.attemptId,
        jugadoEn: scores.playedAt,
      })
      .from(scores)
      .leftJoin(rounds, eq(scores.roundId, rounds.id)),
    db
      .select({ id: courses.id, curso: courses.name, escuela: schools.name, modalidad: modalities.name })
      .from(courses)
      .innerJoin(schools, eq(courses.schoolId, schools.id))
      .innerJoin(modalities, eq(schools.modalityId, modalities.id)),
  ]);
  const cursoDe = new Map(cursos.map((c) => [c.id, c]));

  const notas: { studentId: string; quizId: string; nota: number; editada: boolean; fecha: string | null }[] = [];
  for (const alumno of alumnos) {
    const suyas = partidas
      .filter((p) => p.studentId === alumno.id)
      .map((p) => ({
        quizId: p.quizDeLaSeccion ?? p.quizDirecto,
        attemptId: p.attemptId,
        nota: notaDePartida(p.correctas, p.total),
        jugadoEn: p.jugadoEn,
      }));
    for (const q of listaQuizzes) {
      const delQuiz = suyas.filter((p) => p.quizId === q.id);
      const editada = editadas.get(clave(alumno.id, q.id));
      const nota = notaFinal(notaDelQuiz(delQuiz), editada?.grade);
      if (nota === null) continue;
      const ultima = delQuiz.map((p) => p.jugadoEn?.getTime() ?? 0).reduce((a, b) => Math.max(a, b), 0);
      notas.push({
        studentId: alumno.id,
        quizId: q.id,
        nota: Math.round(nota * 10) / 10,
        editada: !!editada,
        fecha: ultima ? new Date(ultima).toISOString().slice(0, 10) : null,
      });
    }
  }

  return {
    quizzes: listaQuizzes,
    alumnos: alumnos.map((a) => {
      const c = a.courseId ? cursoDe.get(a.courseId) : undefined;
      return { id: a.id, nombre: a.fullName, curso: c?.curso ?? null, escuela: c?.escuela ?? a.school, modalidad: c?.modalidad ?? a.modality };
    }),
    notas,
  };
}
