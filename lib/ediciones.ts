// Notas cambiadas a mano por el admin (tabla grade_edits).
// Cada cambio queda guardado; la que vale es la última de cada alumno en cada quiz.
import type { LibSQLDatabase } from "drizzle-orm/libsql";
import { and, asc, eq, inArray, sql, type SQL } from "drizzle-orm";
import * as schema from "./db/schema";

type DB = LibSQLDatabase<typeof schema>;
const { gradeEdits } = schema;

export type Edicion = typeof gradeEdits.$inferSelect;

export function clave(studentId: string, quizId: string) {
  return `${studentId}|${quizId}`;
}

// Todos los cambios, del más viejo al más nuevo (rowid desempata dos cambios en el mismo milisegundo)
export async function historialDeEdiciones(db: DB, filtro: { studentId?: string; quizId?: string; studentIds?: string[] } = {}) {
  const condiciones: SQL[] = [];
  if (filtro.studentId) condiciones.push(eq(gradeEdits.studentId, filtro.studentId));
  if (filtro.quizId) condiciones.push(eq(gradeEdits.quizId, filtro.quizId));
  if (filtro.studentIds) {
    if (filtro.studentIds.length === 0) return [];
    condiciones.push(inArray(gradeEdits.studentId, filtro.studentIds));
  }
  return db
    .select()
    .from(gradeEdits)
    .where(condiciones.length > 0 ? and(...condiciones) : undefined)
    .orderBy(asc(gradeEdits.editedAt), asc(sql`rowid`));
}

// Nota editada que vale hoy, por alumno y quiz. Si el último cambio fue "quitar edición", no aparece.
export async function edicionesVigentes(db: DB, filtro: Parameters<typeof historialDeEdiciones>[1] = {}) {
  const ultima = new Map<string, Edicion>();
  for (const e of await historialDeEdiciones(db, filtro)) ultima.set(clave(e.studentId, e.quizId), e);
  const vigentes = new Map<string, Edicion & { grade: number }>();
  for (const [k, e] of ultima) if (e.grade !== null) vigentes.set(k, { ...e, grade: e.grade });
  return vigentes;
}
