// Reglas de intentos, juego medido en el servidor, ficha del alumno y ranking.
// Todas las funciones reciben la base como parámetro para poder probarlas con una base de prueba.
import type { LibSQLDatabase } from "drizzle-orm/libsql";
import { and, eq, inArray, isNull, or, sql, type SQL } from "drizzle-orm";
import { v4 as uuid } from "uuid";
import * as schema from "./db/schema";
import { notaDePartida, notaDelQuiz, notaFinal } from "./notas";
import { puntosDeRespuesta, restanteMs, seAcaboElTiempo } from "./puntaje";
import { clave, edicionesVigentes, historialDeEdiciones } from "./ediciones";

export type DB = LibSQLDatabase<typeof schema>;

const { quizzes, rounds, questions, scores, students, courses, schools, modalities, quizCourses, attempts, attemptAnswers, extraAttempts, gradeEdits } =
  schema;

type Intento = typeof attempts.$inferSelect;

// ---------- Reglas ----------

// Cuántos intentos usó y cuántos tiene permitidos.
// Las notas del sistema anterior cuentan como un intento ya hecho.
export function cupo(intentosHechos: number, tieneNotaVieja: boolean, intentosExtra: number) {
  const usados = intentosHechos + (tieneNotaVieja ? 1 : 0);
  const permitidos = 1 + intentosExtra;
  return { usados, permitidos, quedan: usados < permitidos };
}

// Notas del sistema anterior (una por sección jugada) de un alumno en un quiz
export async function notasViejas(db: DB, studentId: string, quizId: string) {
  const filas = await db
    .select({
      correctas: scores.correctAnswers,
      total: scores.totalQuestions,
      playedAt: scores.playedAt,
      quizDirecto: scores.quizId,
      quizDeLaSeccion: rounds.quizId,
    })
    .from(scores)
    .leftJoin(rounds, eq(scores.roundId, rounds.id))
    .where(and(eq(scores.playerName, studentId), isNull(scores.attemptId)));
  return filas.filter((f) => (f.quizDeLaSeccion ?? f.quizDirecto) === quizId);
}

async function estadoDeCupo(db: DB, studentId: string, quizId: string) {
  const delQuiz = and(eq(attempts.studentId, studentId), eq(attempts.quizId, quizId));
  const intentos = await db.select().from(attempts).where(delQuiz);
  const viejas = await notasViejas(db, studentId, quizId);
  const extras = await db
    .select({ id: extraAttempts.id })
    .from(extraAttempts)
    .where(and(eq(extraAttempts.studentId, studentId), eq(extraAttempts.quizId, quizId)));
  return { intentos, viejas, ...cupo(intentos.length, viejas.length > 0, extras.length) };
}

export type Acceso =
  | { tipo: "sin-cuenta" }
  | { tipo: "pendiente" }
  | { tipo: "bloqueado" }
  | { tipo: "sin-curso" }
  | { tipo: "no-habilitado" }
  | { tipo: "ya-respondio"; nota: number | null }
  | { tipo: "puede"; intentoEnCurso: string | null };

// ¿Este alumno puede hacer (o seguir) este quiz? Lo usan la página y todas las APIs del juego.
export async function verificarAcceso(db: DB, studentId: string, quizId: string): Promise<Acceso> {
  const alumno = (await db.select({ courseId: students.courseId, status: students.status }).from(students).where(eq(students.id, studentId)))[0];
  if (!alumno) return { tipo: "sin-cuenta" };
  // Un alumno que el profe todavía no aprobó (o que bloqueó) no puede hacer nada
  if (alumno.status === "pendiente") return { tipo: "pendiente" };
  if (alumno.status === "bloqueado") return { tipo: "bloqueado" };
  if (!alumno.courseId) return { tipo: "sin-curso" };

  const habilitado = await db
    .select()
    .from(quizCourses)
    .where(and(eq(quizCourses.quizId, quizId), eq(quizCourses.courseId, alumno.courseId)));
  if (habilitado.length === 0) return { tipo: "no-habilitado" };

  const estado = await estadoDeCupo(db, studentId, quizId);
  // Si dejó un intento por la mitad (se cortó internet, cerró la pestaña), lo retoma
  const enCurso = estado.intentos.find((i) => !i.finishedAt);
  if (enCurso) return { tipo: "puede", intentoEnCurso: enCurso.id };
  if (estado.quedan) return { tipo: "puede", intentoEnCurso: null };
  return { tipo: "ya-respondio", nota: await notaQueCuenta(db, studentId, quizId) };
}

// Nota que cuenta de un alumno en un quiz: la editada a mano si hay, si no la mejor de los intentos
export async function notaQueCuenta(db: DB, studentId: string, quizId: string) {
  const editada = (await edicionesVigentes(db, { studentId, quizId })).get(clave(studentId, quizId));
  return notaFinal(await notaDeLosIntentos(db, studentId, quizId), editada?.grade);
}

// La mejor nota de los intentos (sin mirar si el admin la editó)
export async function notaDeLosIntentos(db: DB, studentId: string, quizId: string) {
  const viejas = await notasViejas(db, studentId, quizId);
  const nuevas = await db
    .select({ attemptId: scores.attemptId, correctas: scores.correctAnswers, total: scores.totalQuestions })
    .from(scores)
    .innerJoin(attempts, eq(scores.attemptId, attempts.id))
    .where(and(eq(attempts.studentId, studentId), eq(attempts.quizId, quizId)));
  return notaDelQuiz([
    ...viejas.map((v) => ({ attemptId: null, nota: notaDePartida(v.correctas, v.total) })),
    ...nuevas.map((n) => ({ attemptId: n.attemptId, nota: notaDePartida(n.correctas, n.total) })),
  ]);
}

// ---------- Juego ----------

// Todas las preguntas del quiz, sección por sección, en orden
export async function preguntasDelQuiz(db: DB, quizId: string) {
  const filas = await db
    .select({ pregunta: questions, seccion: rounds.name, ordenSeccion: rounds.order, seccionId: rounds.id })
    .from(questions)
    .innerJoin(rounds, eq(questions.roundId, rounds.id))
    .where(eq(rounds.quizId, quizId));
  return filas.sort(
    (a, b) =>
      (a.ordenSeccion ?? 0) - (b.ordenSeccion ?? 0) ||
      a.seccionId.localeCompare(b.seccionId) ||
      (a.pregunta.order ?? 0) - (b.pregunta.order ?? 0)
  );
}

// Lo que ve el alumno de una pregunta: nunca incluye cuál es la correcta
export type PreguntaPublica = {
  numero: number;
  total: number;
  seccion: string;
  question: string;
  questionImage: string | null;
  options: string[];
  optionImages: string[] | null;
  limiteMs: number | null;
  restanteMs: number | null;
};

export type EstadoJuego =
  | { tipo: "pregunta"; intentoId: string; puntos: number; pregunta: PreguntaPublica }
  | { tipo: "final"; correctas: number; total: number; nota: number; puntos: number }
  | { tipo: "bloqueado"; acceso: Acceso }
  | { tipo: "sin-preguntas" }
  | { tipo: "no-encontrado" };

export type ResultadoRespuesta = {
  tipo: "respuesta";
  correcta: boolean;
  correctIndex: number;
  explanation: string | null;
  puntosGanados: number;
  puntos: number;
  terminado: boolean;
};

export async function empezarOContinuar(db: DB, studentId: string, quizId: string, ahora = Date.now()): Promise<EstadoJuego> {
  const acceso = await verificarAcceso(db, studentId, quizId);
  if (acceso.tipo !== "puede") return { tipo: "bloqueado", acceso };

  let intentoId = acceso.intentoEnCurso;
  if (!intentoId) {
    const preguntas = await preguntasDelQuiz(db, quizId);
    if (preguntas.length === 0) return { tipo: "sin-preguntas" };

    const delQuiz = and(eq(attempts.studentId, studentId), eq(attempts.quizId, quizId));
    const anteriores = await db.select({ numero: attempts.number }).from(attempts).where(delQuiz);
    const numero = Math.max(0, ...anteriores.map((a) => a.numero)) + 1;
    intentoId = uuid();
    try {
      await db.insert(attempts).values({
        id: intentoId,
        studentId,
        quizId,
        number: numero,
        questionIds: JSON.stringify(preguntas.map((p) => p.pregunta.id)),
        currentIndex: 0,
        shownAtMs: ahora,
        startedAt: new Date(ahora),
      });
    } catch (error) {
      // Otra pestaña creó el intento al mismo tiempo (la base no deja dos con el mismo número): seguimos con ese
      const otro = (await db.select().from(attempts).where(and(delQuiz, eq(attempts.number, numero))))[0];
      if (!otro) throw error;
      intentoId = otro.id;
    }
  }
  return estadoDelIntento(db, intentoId, ahora);
}

// Si el profe bloqueó la cuenta (o la borró) en medio de un intento, tampoco puede seguir respondiendo
async function cuentaSinPermiso(db: DB, studentId: string): Promise<EstadoJuego | null> {
  const alumno = (await db.select({ status: students.status }).from(students).where(eq(students.id, studentId)))[0];
  if (!alumno) return { tipo: "bloqueado", acceso: { tipo: "sin-cuenta" } };
  if (alumno.status !== "aprobado") return { tipo: "bloqueado", acceso: { tipo: alumno.status } };
  return null;
}

async function buscarIntento(db: DB, studentId: string, intentoId: string) {
  return (await db.select().from(attempts).where(and(eq(attempts.id, intentoId), eq(attempts.studentId, studentId))))[0];
}

async function limiteDelQuiz(db: DB, quizId: string) {
  return (await db.select({ timeLimit: quizzes.timeLimit }).from(quizzes).where(eq(quizzes.id, quizId)))[0]?.timeLimit ?? null;
}

async function totalesDelIntento(db: DB, intentoId: string) {
  const fila = (
    await db
      .select({
        respondidas: sql<number>`count(*)`.mapWith(Number),
        correctas: sql<number>`coalesce(sum(${attemptAnswers.isCorrect}), 0)`.mapWith(Number),
        puntos: sql<number>`coalesce(sum(${attemptAnswers.points}), 0)`.mapWith(Number),
        tiempoMs: sql<number>`coalesce(sum(${attemptAnswers.elapsedMs}), 0)`.mapWith(Number),
      })
      .from(attemptAnswers)
      .where(eq(attemptAnswers.attemptId, intentoId))
  )[0];
  return fila;
}

// Deja la pregunta actual cerrada; si era la última, termina el intento y guarda la nota
async function cerrarPregunta(db: DB, intento: Intento, ahora: number) {
  const ids: string[] = JSON.parse(intento.questionIds);
  const ultima = intento.currentIndex >= ids.length - 1;
  await db
    .update(attempts)
    .set({ shownAtMs: null, finishedAt: ultima ? new Date(ahora) : null })
    .where(and(eq(attempts.id, intento.id), eq(attempts.currentIndex, intento.currentIndex)));
  if (ultima) await guardarNota(db, intento.id);
  return ultima;
}

// Pasa a la siguiente pregunta y empieza a contar su tiempo desde ahora
async function avanzar(db: DB, intento: Intento, ahora: number) {
  await db
    .update(attempts)
    .set({ currentIndex: intento.currentIndex + 1, shownAtMs: ahora })
    // Si llegan dos "siguiente" juntos (doble clic), solo el primero avanza
    .where(and(eq(attempts.id, intento.id), eq(attempts.currentIndex, intento.currentIndex), isNull(attempts.shownAtMs)));
}

// Guarda la nota del intento en la tabla de notas de siempre (así la versión anterior de la app también la ve)
async function guardarNota(db: DB, intentoId: string) {
  const intento = (await db.select().from(attempts).where(eq(attempts.id, intentoId)))[0];
  const t = await totalesDelIntento(db, intentoId);
  if (!intento || t.respondidas === 0) return;
  await db
    .insert(scores)
    .values({
      id: intentoId,
      quizId: intento.quizId,
      roundId: null,
      playerName: intento.studentId,
      score: Math.round(notaDePartida(t.correctas, t.respondidas) * 10),
      totalQuestions: t.respondidas,
      correctAnswers: t.correctas,
      playedAt: intento.finishedAt ?? new Date(),
      attemptId: intentoId,
    })
    .onConflictDoNothing();
}

async function registrarRespuesta(db: DB, intento: Intento, elegida: number | null, ahora: number) {
  const ids: string[] = JSON.parse(intento.questionIds);
  const pregunta = (await db.select().from(questions).where(eq(questions.id, ids[intento.currentIndex])))[0];
  const timeLimit = await limiteDelQuiz(db, intento.quizId);
  const elapsedMs = Math.max(0, ahora - (intento.shownAtMs ?? ahora));

  // El tiempo lo mide el servidor: si la respuesta llega tarde, no vale aunque sea la correcta
  const correcta = !!pregunta && !seAcaboElTiempo(timeLimit, elapsedMs) && elegida === pregunta.correctIndex;
  const puntosGanados = puntosDeRespuesta(correcta, timeLimit, elapsedMs);

  if (pregunta) {
    await db
      .insert(attemptAnswers)
      .values({
        id: uuid(),
        attemptId: intento.id,
        questionId: pregunta.id,
        chosenIndex: elegida,
        isCorrect: correcta,
        elapsedMs,
        points: puntosGanados,
        answeredAt: new Date(ahora),
      })
      .onConflictDoNothing();
  }
  const terminado = await cerrarPregunta(db, intento, ahora);
  return { pregunta, correcta, puntosGanados, terminado };
}

async function estadoFinal(db: DB, intentoId: string): Promise<EstadoJuego> {
  const t = await totalesDelIntento(db, intentoId);
  return {
    tipo: "final",
    correctas: t.correctas,
    total: t.respondidas,
    nota: Math.round(notaDePartida(t.correctas, t.respondidas) * 10) / 10,
    puntos: t.puntos,
  };
}

// Devuelve dónde quedó el intento. Si el alumno recargó la página, el reloj siguió corriendo:
// las preguntas vencidas se cuentan como "se acabó el tiempo".
export async function estadoDelIntento(db: DB, intentoId: string, ahora = Date.now()): Promise<EstadoJuego> {
  for (;;) {
    const intento = (await db.select().from(attempts).where(eq(attempts.id, intentoId)))[0];
    if (!intento) return { tipo: "no-encontrado" };
    if (intento.finishedAt) return estadoFinal(db, intentoId);

    // Respondió y recargó antes de tocar "Siguiente": pasamos a la próxima
    if (intento.shownAtMs === null) {
      await avanzar(db, intento, ahora);
      continue;
    }

    const ids: string[] = JSON.parse(intento.questionIds);
    const timeLimit = await limiteDelQuiz(db, intento.quizId);
    const elapsedMs = ahora - intento.shownAtMs;
    const fila = (
      await db
        .select({ pregunta: questions, seccion: rounds.name })
        .from(questions)
        .leftJoin(rounds, eq(questions.roundId, rounds.id))
        .where(eq(questions.id, ids[intento.currentIndex]))
    )[0];

    // Pregunta borrada mientras jugaba, o tiempo vencido: se cierra y seguimos
    if (!fila || seAcaboElTiempo(timeLimit, elapsedMs)) {
      if (fila) await registrarRespuesta(db, intento, null, ahora);
      else await cerrarPregunta(db, intento, ahora);
      continue;
    }

    const p = fila.pregunta;
    return {
      tipo: "pregunta",
      intentoId,
      puntos: (await totalesDelIntento(db, intentoId)).puntos,
      pregunta: {
        numero: intento.currentIndex + 1,
        total: ids.length,
        seccion: fila.seccion ?? "",
        question: p.question,
        questionImage: p.questionImage,
        options: JSON.parse(p.options),
        optionImages: p.optionImages ? JSON.parse(p.optionImages) : null,
        limiteMs: timeLimit ? timeLimit * 1000 : null,
        restanteMs: restanteMs(timeLimit, elapsedMs),
      },
    };
  }
}

// elegida = null cuando al alumno se le acabó el tiempo
export async function responder(
  db: DB,
  studentId: string,
  intentoId: string,
  elegida: number | null,
  ahora = Date.now()
): Promise<ResultadoRespuesta | EstadoJuego> {
  const sinPermiso = await cuentaSinPermiso(db, studentId);
  if (sinPermiso) return sinPermiso;
  const intento = await buscarIntento(db, studentId, intentoId);
  if (!intento) return { tipo: "no-encontrado" };
  if (intento.finishedAt || intento.shownAtMs === null) {
    // Ya estaba respondida (doble clic o reenvío): devolvemos lo que quedó guardado
    const ids: string[] = JSON.parse(intento.questionIds);
    const guardada = (
      await db
        .select({ respuesta: attemptAnswers, pregunta: questions })
        .from(attemptAnswers)
        .innerJoin(questions, eq(attemptAnswers.questionId, questions.id))
        .where(and(eq(attemptAnswers.attemptId, intentoId), eq(attemptAnswers.questionId, ids[intento.currentIndex])))
    )[0];
    if (!guardada) return estadoDelIntento(db, intentoId, ahora);
    return {
      tipo: "respuesta",
      correcta: guardada.respuesta.isCorrect,
      correctIndex: guardada.pregunta.correctIndex,
      explanation: guardada.pregunta.explanation,
      puntosGanados: guardada.respuesta.points,
      puntos: (await totalesDelIntento(db, intentoId)).puntos,
      terminado: !!intento.finishedAt,
    };
  }

  const r = await registrarRespuesta(db, intento, elegida, ahora);
  if (!r.pregunta) return estadoDelIntento(db, intentoId, ahora);
  return {
    tipo: "respuesta",
    correcta: r.correcta,
    correctIndex: r.pregunta.correctIndex,
    explanation: r.pregunta.explanation,
    puntosGanados: r.puntosGanados,
    puntos: (await totalesDelIntento(db, intentoId)).puntos,
    terminado: r.terminado,
  };
}

export async function siguiente(db: DB, studentId: string, intentoId: string, ahora = Date.now()): Promise<EstadoJuego> {
  const sinPermiso = await cuentaSinPermiso(db, studentId);
  if (sinPermiso) return sinPermiso;
  const intento = await buscarIntento(db, studentId, intentoId);
  if (!intento) return { tipo: "no-encontrado" };
  if (!intento.finishedAt && intento.shownAtMs === null) await avanzar(db, intento, ahora);
  return estadoDelIntento(db, intentoId, ahora);
}

// ---------- Acciones del admin ----------

export async function habilitarOtroIntento(db: DB, studentId: string, quizId: string, ahora = Date.now()) {
  const estado = await estadoDeCupo(db, studentId, quizId);
  // Si todavía tiene un intento disponible (o uno a medias), no sumamos otro
  if (estado.quedan || estado.intentos.some((i) => !i.finishedAt)) return { ok: false as const, error: "Ya tiene un intento disponible." };
  await db.insert(extraAttempts).values({ id: uuid(), studentId, quizId, grantedAt: new Date(ahora) });
  return { ok: true as const };
}

// Borra todo lo de ESE alumno en ESE quiz: intentos, respuestas, notas (nuevas, viejas y editadas) e intentos extra.
// Queda como si nunca lo hubiera hecho.
export async function borrarNota(db: DB, studentId: string, quizId: string) {
  const delQuiz = and(eq(attempts.studentId, studentId), eq(attempts.quizId, quizId));
  const idsIntentos = (await db.select({ id: attempts.id }).from(attempts).where(delQuiz)).map((i) => i.id);
  const idsSecciones = (await db.select({ id: rounds.id }).from(rounds).where(eq(rounds.quizId, quizId))).map((r) => r.id);

  const notasViejasDelQuiz: SQL[] = [eq(scores.quizId, quizId)];
  if (idsSecciones.length > 0) notasViejasDelQuiz.push(inArray(scores.roundId, idsSecciones));

  const pasos = [
    db.delete(scores).where(and(eq(scores.playerName, studentId), isNull(scores.attemptId), or(...notasViejasDelQuiz))),
    db.delete(extraAttempts).where(and(eq(extraAttempts.studentId, studentId), eq(extraAttempts.quizId, quizId))),
    db.delete(gradeEdits).where(and(eq(gradeEdits.studentId, studentId), eq(gradeEdits.quizId, quizId))),
  ] as const;
  // Todo junto: si algo falla, no se borra nada
  if (idsIntentos.length > 0) {
    await db.batch([
      ...pasos,
      db.delete(scores).where(inArray(scores.attemptId, idsIntentos)),
      db.delete(attemptAnswers).where(inArray(attemptAnswers.attemptId, idsIntentos)),
      db.delete(attempts).where(delQuiz),
    ]);
  } else {
    await db.batch(pasos);
  }
}

// ---------- Ficha del alumno ----------

export async function fichaDelAlumno(db: DB, studentId: string) {
  const alumno = (
    await db
      .select({
        id: students.id,
        fullName: students.fullName,
        username: students.username,
        status: students.status,
        curso: courses.name,
        escuela: schools.name,
        modalidad: modalities.name,
      })
      .from(students)
      .leftJoin(courses, eq(students.courseId, courses.id))
      .leftJoin(schools, eq(courses.schoolId, schools.id))
      .leftJoin(modalities, eq(schools.modalityId, modalities.id))
      .where(eq(students.id, studentId))
  )[0];
  if (!alumno) return null;

  const listaQuizzes = await db.select({ id: quizzes.id, title: quizzes.title }).from(quizzes);
  const intentos = await db.select().from(attempts).where(eq(attempts.studentId, studentId));
  const totales = new Map<string, Awaited<ReturnType<typeof totalesDelIntento>>>();
  for (const i of intentos) totales.set(i.id, await totalesDelIntento(db, i.id));
  const vigentes = await edicionesVigentes(db, { studentId });
  const historial = await historialDeEdiciones(db, { studentId });

  const filas = [];
  for (const q of listaQuizzes) {
    const viejas = await notasViejas(db, studentId, q.id);
    const suyos = intentos.filter((i) => i.quizId === q.id).sort((a, b) => a.number - b.number);
    if (viejas.length === 0 && suyos.length === 0) continue;

    const listaIntentos = suyos.map((i) => {
      const t = totales.get(i.id)!;
      return {
        id: i.id,
        numero: i.number,
        enCurso: !i.finishedAt,
        nota: i.finishedAt ? Math.round(notaDePartida(t.correctas, t.respondidas) * 10) / 10 : null,
        correctas: t.correctas,
        respondidas: t.respondidas,
        puntos: t.puntos,
        empezo: i.startedAt.getTime(),
        duracionMs: i.finishedAt ? i.finishedAt.getTime() - i.startedAt.getTime() : null,
      };
    });
    const notaVieja = viejas.length > 0 ? notaDelQuiz(viejas.map((v) => ({ attemptId: null, nota: notaDePartida(v.correctas, v.total) }))) : null;
    const notaCalculada = notaDelQuiz([
      ...(notaVieja !== null ? [{ attemptId: null, nota: notaVieja }] : []),
      ...listaIntentos.filter((i) => i.nota !== null).map((i) => ({ attemptId: i.id, nota: i.nota! })),
    ]);
    const editada = vigentes.get(clave(studentId, q.id));
    const c = await estadoDeCupo(db, studentId, q.id);

    filas.push({
      quizId: q.id,
      titulo: q.title,
      nota: notaFinal(notaCalculada, editada?.grade),
      notaCalculada,
      editada: editada ? { nota: editada.grade, fecha: editada.editedAt.getTime(), por: editada.editedBy } : null,
      // Registro de todos los cambios a mano de este quiz (también los que después se quitaron)
      cambios: historial
        .filter((e) => e.quizId === q.id)
        .map((e) => ({ id: e.id, nota: e.grade, anterior: e.previousGrade, fecha: e.editedAt.getTime(), por: e.editedBy })),
      tieneIntentoDisponible: c.quedan || listaIntentos.some((i) => i.enCurso),
      anterior:
        notaVieja !== null
          ? { nota: notaVieja, fecha: Math.max(...viejas.map((v) => v.playedAt?.getTime() ?? 0)) || null }
          : null,
      intentos: listaIntentos,
    });
  }
  filas.sort((a, b) => a.titulo.localeCompare(b.titulo, "es", { numeric: true }));
  return { alumno, quizzes: filas };
}

// ---------- Ranking en vivo ----------

export type FilaRanking = { id: string; nombre: string; empezo: boolean; terminado: boolean; puntos: number; respondidas: number; tiempoMs: number };

// Mayor puntaje primero; si empatan, el que tardó menos. Los que no empezaron van al final.
export function ordenarRanking(filas: FilaRanking[]) {
  return [...filas].sort(
    (a, b) =>
      Number(b.empezo) - Number(a.empezo) || b.puntos - a.puntos || a.tiempoMs - b.tiempoMs || a.nombre.localeCompare(b.nombre, "es")
  );
}

export async function ranking(db: DB, quizId: string, courseId: string) {
  // Solo los alumnos aprobados (los pendientes y los bloqueados no aparecen)
  const alumnos = await db
    .select({ id: students.id, nombre: students.fullName })
    .from(students)
    .where(and(eq(students.courseId, courseId), eq(students.status, "aprobado")));
  const ids = alumnos.map((a) => a.id);
  const intentos = ids.length > 0 ? await db.select().from(attempts).where(and(eq(attempts.quizId, quizId), inArray(attempts.studentId, ids))) : [];

  // De cada alumno se muestra su último intento (el que está jugando ahora)
  const ultimo = new Map<string, Intento>();
  for (const i of intentos) {
    const previo = ultimo.get(i.studentId);
    if (!previo || i.number > previo.number) ultimo.set(i.studentId, i);
  }

  const idsUltimos = [...ultimo.values()].map((i) => i.id);
  const sumas =
    idsUltimos.length > 0
      ? await db
          .select({
            attemptId: attemptAnswers.attemptId,
            respondidas: sql<number>`count(*)`.mapWith(Number),
            puntos: sql<number>`sum(${attemptAnswers.points})`.mapWith(Number),
            tiempoMs: sql<number>`sum(${attemptAnswers.elapsedMs})`.mapWith(Number),
          })
          .from(attemptAnswers)
          .where(inArray(attemptAnswers.attemptId, idsUltimos))
          .groupBy(attemptAnswers.attemptId)
      : [];
  const porIntento = new Map(sumas.map((s) => [s.attemptId, s]));

  const filas = alumnos.map((a) => {
    const i = ultimo.get(a.id);
    const s = i ? porIntento.get(i.id) : undefined;
    return {
      id: a.id,
      nombre: a.nombre,
      empezo: !!i,
      terminado: !!i?.finishedAt,
      puntos: s?.puntos ?? 0,
      respondidas: s?.respondidas ?? 0,
      tiempoMs: s?.tiempoMs ?? 0,
    };
  });
  const totalPreguntas = (await preguntasDelQuiz(db, quizId)).length;
  return { totalPreguntas, filas: ordenarRanking(filas) };
}

// ---------- Quizzes por curso ----------

export async function quizzesDelCurso(db: DB, courseId: string) {
  return db
    .select({ quiz: quizzes })
    .from(quizzes)
    .innerJoin(quizCourses, eq(quizCourses.quizId, quizzes.id))
    .where(eq(quizCourses.courseId, courseId))
    .then((filas) => filas.map((f) => f.quiz));
}

export async function cambiarCursoDelQuiz(db: DB, quizId: string, courseId: string, habilitado: boolean) {
  if (habilitado) {
    await db.insert(quizCourses).values({ quizId, courseId }).onConflictDoNothing();
  } else {
    await db.delete(quizCourses).where(and(eq(quizCourses.quizId, quizId), eq(quizCourses.courseId, courseId)));
  }
}
