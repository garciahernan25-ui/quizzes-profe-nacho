// Notas editadas a mano y recálculo de un quiz cuando se corrige la respuesta correcta de una pregunta.
import { and, eq, inArray, isNull, or, type SQL } from "drizzle-orm";
import { v4 as uuid } from "uuid";
import * as schema from "./db/schema";
import type { DB } from "./intentos";
import { notaQueCuenta } from "./intentos";
import { clave, edicionesVigentes } from "./ediciones";
import { notaDePartida, notaDelQuiz } from "./notas";
import { puntosDeRespuesta, seAcaboElTiempo } from "./puntaje";

const { quizzes, rounds, questions, scores, students, courses, attempts, attemptAnswers, gradeEdits } = schema;

// El panel tiene una sola clave de admin: no hay forma de saber qué persona hizo el cambio
export const EDITADO_POR = "Admin";

// ---------- Editar nota ----------

export async function editarNota(db: DB, studentId: string, quizId: string, nota: number, ahora = Date.now()) {
  if (!Number.isFinite(nota) || nota < 0 || nota > 10) return { ok: false as const, error: "La nota tiene que ser de 0 a 10." };
  const existe = (await db.select({ id: students.id }).from(students).where(eq(students.id, studentId)))[0];
  if (!existe) return { ok: false as const, error: "No existe el alumno." };
  await db.insert(gradeEdits).values({
    id: uuid(),
    studentId,
    quizId,
    grade: Math.round(nota * 10) / 10,
    previousGrade: await notaQueCuenta(db, studentId, quizId),
    editedBy: EDITADO_POR,
    editedAt: new Date(ahora),
  });
  return { ok: true as const };
}

// Vuelve a contar la nota de los intentos. El cambio también queda en el registro.
export async function quitarEdicion(db: DB, studentId: string, quizId: string, ahora = Date.now()) {
  const vigente = (await edicionesVigentes(db, { studentId, quizId })).get(clave(studentId, quizId));
  if (!vigente) return { ok: false as const, error: "Esa nota no está editada." };
  await db.insert(gradeEdits).values({
    id: uuid(),
    studentId,
    quizId,
    grade: null,
    previousGrade: vigente.grade,
    editedBy: EDITADO_POR,
    editedAt: new Date(ahora),
  });
  return { ok: true as const };
}

// ---------- Recalcular un quiz ----------

const redondear = (n: number) => Math.round(n * 10) / 10;

type AlumnoCambio = { studentId: string; nombre: string; curso: string | null; antes: number | null; despues: number | null };

export type Recalculo = {
  respuestasQueCambian: number;
  // Su nota cambia
  cambian: AlumnoCambio[];
  // Tienen la nota editada a mano: no se les toca, pero se muestra lo que sacarían
  editadas: (AlumnoCambio & { notaEditada: number })[];
  // Tienen notas del sistema anterior, que no guardaba las respuestas: esa parte no se puede recalcular
  viejas: { studentId: string; nombre: string; curso: string | null; nota: number }[];
};

// Compara cada respuesta guardada con la respuesta correcta de HOY y arma lo que cambiaría.
// No toca nada de la base.
async function calcular(db: DB, quizId: string) {
  const timeLimit = (await db.select({ timeLimit: quizzes.timeLimit }).from(quizzes).where(eq(quizzes.id, quizId)))[0]?.timeLimit ?? null;
  const intentos = await db.select().from(attempts).where(eq(attempts.quizId, quizId));
  const idsIntentos = intentos.map((i) => i.id);
  const respuestas = idsIntentos.length > 0 ? await db.select().from(attemptAnswers).where(inArray(attemptAnswers.attemptId, idsIntentos)) : [];
  const idsPreguntas = [...new Set(respuestas.map((r) => r.questionId))];
  const correctas = new Map(
    (idsPreguntas.length > 0 ? await db.select({ id: questions.id, correctIndex: questions.correctIndex }).from(questions).where(inArray(questions.id, idsPreguntas)) : []).map(
      (p) => [p.id, p.correctIndex]
    )
  );

  const cambiosRespuestas: { id: string; isCorrect: boolean; points: number }[] = [];
  const nuevoCorrecto = new Map<string, boolean>(); // id de respuesta → si queda bien
  for (const r of respuestas) {
    const correctIndex = correctas.get(r.questionId);
    // Pregunta borrada, o se le acabó el tiempo sin elegir nada: queda como está
    if (correctIndex === undefined || r.chosenIndex === null) {
      nuevoCorrecto.set(r.id, r.isCorrect);
      continue;
    }
    // Si antes estaba bien, llegó a tiempo. Si estaba mal, puede ser porque llegó tarde: eso no cambia.
    const bien = r.chosenIndex === correctIndex && (r.isCorrect || !seAcaboElTiempo(timeLimit, r.elapsedMs));
    nuevoCorrecto.set(r.id, bien);
    if (bien !== r.isCorrect) cambiosRespuestas.push({ id: r.id, isCorrect: bien, points: puntosDeRespuesta(bien, timeLimit, r.elapsedMs) });
  }

  // Nota de cada intento terminado, antes y después
  const porIntento = new Map<string, { antes: number; despues: number; correctasAntes: number; correctas: number; total: number }>();
  for (const i of intentos) {
    if (!i.finishedAt) continue;
    const suyas = respuestas.filter((r) => r.attemptId === i.id);
    const antes = suyas.filter((r) => r.isCorrect).length;
    const despues = suyas.filter((r) => nuevoCorrecto.get(r.id)).length;
    porIntento.set(i.id, {
      antes: redondear(notaDePartida(antes, suyas.length)),
      despues: redondear(notaDePartida(despues, suyas.length)),
      correctasAntes: antes,
      correctas: despues,
      total: suyas.length,
    });
  }

  // Notas del sistema anterior de este quiz (por el quiz directo o por sus secciones)
  const idsSecciones = (await db.select({ id: rounds.id }).from(rounds).where(eq(rounds.quizId, quizId))).map((r) => r.id);
  const delQuiz: SQL[] = [eq(scores.quizId, quizId)];
  if (idsSecciones.length > 0) delQuiz.push(inArray(scores.roundId, idsSecciones));
  const filasViejas = await db
    .select({ studentId: scores.playerName, correctas: scores.correctAnswers, total: scores.totalQuestions })
    .from(scores)
    .where(and(isNull(scores.attemptId), or(...delQuiz)));
  const viejaPorAlumno = new Map<string, number[]>();
  for (const v of filasViejas) {
    if (!v.studentId) continue;
    viejaPorAlumno.set(v.studentId, [...(viejaPorAlumno.get(v.studentId) ?? []), notaDePartida(v.correctas, v.total)]);
  }

  const idsAlumnos = [...new Set([...intentos.map((i) => i.studentId), ...viejaPorAlumno.keys()])];
  const alumnos =
    idsAlumnos.length > 0
      ? await db
          .select({ id: students.id, nombre: students.fullName, curso: courses.name })
          .from(students)
          .leftJoin(courses, eq(students.courseId, courses.id))
          .where(inArray(students.id, idsAlumnos))
      : [];
  const vigentes = await edicionesVigentes(db, { quizId });

  const resultado: Recalculo = { respuestasQueCambian: cambiosRespuestas.length, cambian: [], editadas: [], viejas: [] };
  for (const a of alumnos) {
    const viejas = (viejaPorAlumno.get(a.id) ?? []).map((nota) => ({ attemptId: null, nota }));
    const suyos = intentos.filter((i) => i.studentId === a.id && porIntento.has(i.id));
    const antes = notaDelQuiz([...viejas, ...suyos.map((i) => ({ attemptId: i.id, nota: porIntento.get(i.id)!.antes }))]);
    const despues = notaDelQuiz([...viejas, ...suyos.map((i) => ({ attemptId: i.id, nota: porIntento.get(i.id)!.despues }))]);
    const fila = { studentId: a.id, nombre: a.nombre, curso: a.curso };

    if (viejas.length > 0) resultado.viejas.push({ ...fila, nota: notaDelQuiz(viejas)! });
    if (antes === despues) continue;
    const editada = vigentes.get(clave(a.id, quizId));
    if (editada) resultado.editadas.push({ ...fila, antes, despues, notaEditada: editada.grade });
    else resultado.cambian.push({ ...fila, antes, despues });
  }
  const porNombre = (x: { nombre: string }, y: { nombre: string }) => x.nombre.localeCompare(y.nombre, "es");
  resultado.cambian.sort(porNombre);
  resultado.editadas.sort(porNombre);
  resultado.viejas.sort(porNombre);
  return { resultado, cambiosRespuestas, porIntento };
}

export async function vistaPreviaRecalculo(db: DB, quizId: string) {
  return (await calcular(db, quizId)).resultado;
}

// Aplica el recálculo: corrige las respuestas, los puntos del ranking y la nota de cada intento.
// Las notas editadas a mano siguen mandando (no se tocan) y las del sistema anterior quedan como están.
// Todo junto: si algo falla, no se cambia nada.
export async function aplicarRecalculo(db: DB, quizId: string) {
  const { resultado, cambiosRespuestas, porIntento } = await calcular(db, quizId);
  if (cambiosRespuestas.length === 0) return resultado;

  const pasos = [
    ...cambiosRespuestas.map((c) => db.update(attemptAnswers).set({ isCorrect: c.isCorrect, points: c.points }).where(eq(attemptAnswers.id, c.id))),
    ...[...porIntento]
      .filter(([, n]) => n.correctas !== n.correctasAntes)
      .map(([attemptId, n]) =>
        db
          .update(scores)
          .set({ correctAnswers: n.correctas, score: Math.round(notaDePartida(n.correctas, n.total) * 10) })
          .where(eq(scores.attemptId, attemptId))
      ),
  ];
  await db.batch(pasos as [(typeof pasos)[number], ...(typeof pasos)[number][]]);
  return resultado;
}
