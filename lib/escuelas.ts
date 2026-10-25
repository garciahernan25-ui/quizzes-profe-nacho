import { db } from "./db";
import { modalities, schools, courses, students } from "./db/schema";
import { eq } from "drizzle-orm";
import { normalizar } from "./texto";

export type Tipo = "modalidad" | "escuela" | "curso";

export const TIPOS: Tipo[] = ["modalidad", "escuela", "curso"];

// Limpia el nombre que escribió el admin (saca espacios de más)
export function limpiarNombre(texto: unknown) {
  return typeof texto === "string" ? texto.replace(/\s+/g, " ").trim() : "";
}

// Busca si ya hay otro elemento con el mismo nombre dentro del mismo "padre"
// (modalidades: entre todas; escuelas: dentro de su modalidad; cursos: dentro de su escuela)
export async function nombreRepetido(tipo: Tipo, nombre: string, padreId: string | null, sinContarId?: string) {
  const hermanos =
    tipo === "modalidad"
      ? await db.select().from(modalities)
      : tipo === "escuela"
        ? await db.select().from(schools).where(eq(schools.modalityId, padreId!))
        : await db.select().from(courses).where(eq(courses.schoolId, padreId!));

  const buscado = normalizar(nombre);
  return hermanos.some((h) => h.id !== sinContarId && normalizar(h.name) === buscado);
}

// Devuelve el motivo por el que NO se puede borrar, o null si se puede
export async function motivoParaNoBorrar(tipo: Tipo, id: string) {
  if (tipo === "modalidad") {
    const hijas = await db.select().from(schools).where(eq(schools.modalityId, id));
    if (hijas.length > 0) return `Tiene ${hijas.length} escuela(s). Borralas primero, u ocultá la modalidad.`;
  }
  if (tipo === "escuela") {
    const hijos = await db.select().from(courses).where(eq(courses.schoolId, id));
    if (hijos.length > 0) return `Tiene ${hijos.length} curso(s). Borralos primero, u ocultá la escuela.`;
  }
  if (tipo === "curso") {
    const alumnos = await db.select({ id: students.id }).from(students).where(eq(students.courseId, id));
    if (alumnos.length > 0) return `Tiene ${alumnos.length} alumno(s) asignado(s). Ocultá el curso en lugar de borrarlo.`;
  }
  return null;
}
