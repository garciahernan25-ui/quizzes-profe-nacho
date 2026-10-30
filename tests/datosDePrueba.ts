// Datos de prueba que comparten los tests:
// - Curso 1: Ana, Beto, Caro. Curso 2: Dani. Eli sin curso.
// - Quiz "Biología" (30 s por pregunta, 2 secciones, 3 preguntas) y "Energía" (sin límite, 1 pregunta).
// - Los dos quizzes habilitados para el curso 1. Ninguno para el curso 2.
// - En todas las preguntas la correcta es la opción 1.
import * as s from "../lib/db/schema";
import { type DB, empezarOContinuar, responder, siguiente } from "../lib/intentos";

export const T0 = 1_800_000_000_000; // un "ahora" fijo para controlar el tiempo en los tests

export function alumno(id: string, fullName: string, courseId: string | null) {
  return { id, fullName, username: id, passwordHash: "x", modality: "Secundaria", school: "Escuela 5", courseId };
}

export async function cargarDatos(db: DB) {
  await db.insert(s.modalities).values({ id: "m1", name: "Secundaria" });
  await db.insert(s.schools).values({ id: "e1", modalityId: "m1", name: "Escuela 5" });
  await db.insert(s.courses).values([
    { id: "c1", schoolId: "e1", name: "1ro A" },
    { id: "c2", schoolId: "e1", name: "2do B" },
  ]);
  await db.insert(s.students).values([
    alumno("ana", "Ana", "c1"),
    alumno("beto", "Beto", "c1"),
    alumno("caro", "Caro", "c1"),
    alumno("dani", "Dani", "c2"),
    alumno("eli", "Eli", null),
  ]);
  await db.insert(s.quizzes).values([
    { id: "bio", title: "Biología", slug: "bio", timeLimit: 30, isPublished: false },
    { id: "ene", title: "Energía", slug: "ene", timeLimit: null, isPublished: true },
  ]);
  await db.insert(s.rounds).values([
    { id: "r1", quizId: "bio", name: "Nutrientes", order: 0 },
    { id: "r2", quizId: "bio", name: "Digestión", order: 1 },
    { id: "r3", quizId: "ene", name: "General", order: 0 },
  ]);
  const pregunta = (id: string, roundId: string, order: number) => ({
    id, roundId, order, question: id, options: JSON.stringify(["a", "b", "c"]), correctIndex: 1,
  });
  // Cargadas desordenadas a propósito: el juego tiene que seguir el orden de secciones y preguntas
  await db.insert(s.questions).values([pregunta("p3", "r2", 0), pregunta("p2", "r1", 1), pregunta("p1", "r1", 0), pregunta("e1", "r3", 0)]);
  await db.insert(s.quizCourses).values([
    { quizId: "bio", courseId: "c1" },
    { quizId: "ene", courseId: "c1" },
  ]);
}

// Hace el quiz entero respondiendo con las opciones dadas, una pregunta cada `cadaMs`
export async function jugar(db: DB, studentId: string, quizId: string, elegidas: (number | null)[], cadaMs = 5_000, desde = T0) {
  let ahora = desde;
  const inicio = await empezarOContinuar(db, studentId, quizId, ahora);
  if (inicio.tipo !== "pregunta") throw new Error(`No pudo empezar: ${JSON.stringify(inicio)}`);
  for (const elegida of elegidas) {
    ahora += cadaMs;
    await responder(db, studentId, inicio.intentoId, elegida, ahora);
    await siguiente(db, studentId, inicio.intentoId, ahora);
  }
  return inicio.intentoId;
}
