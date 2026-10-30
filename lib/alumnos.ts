// Aprobación de alumnos nuevos, cambio de nombre y bloqueo.
// Las funciones reciben la base como parámetro para poder probarlas con una base de prueba.
import { and, asc, eq, sql } from "drizzle-orm";
import * as schema from "./db/schema";
import type { DB } from "./intentos";
import { v4 as uuid } from "uuid";
import bcrypt from "bcryptjs";

const { students, courses, schools, modalities } = schema;

export const LARGO_MAXIMO_NOMBRE = 80;

// Nombre limpio (sin espacios de más) o null si quedó vacío o es demasiado largo
export function limpiarNombre(nombre: unknown) {
  if (typeof nombre !== "string") return null;
  const limpio = nombre.replace(/\s+/g, " ").trim();
  return limpio.length > 0 && limpio.length <= LARGO_MAXIMO_NOMBRE ? limpio : null;
}

// Estado del alumno de la cookie. "no-existe" = lo rechazaron (se borró) o la cookie es vieja.
export async function estadoDelAlumno(db: DB, studentId: string) {
  const fila = (await db.select({ status: students.status }).from(students).where(eq(students.id, studentId)))[0];
  return fila?.status ?? "no-existe";
}

export async function cantidadPendientes(db: DB) {
  const fila = (
    await db
      .select({ n: sql<number>`count(*)`.mapWith(Number) })
      .from(students)
      .where(eq(students.status, "pendiente"))
  )[0];
  return fila?.n ?? 0;
}

// Lista de pendientes, del más viejo al más nuevo (así se aprueban en el orden en que llegaron)
export async function pendientes(db: DB) {
  return db
    .select({
      id: students.id,
      fullName: students.fullName,
      username: students.username,
      courseId: students.courseId,
      curso: courses.name,
      escuela: schools.name,
      modalidad: modalities.name,
      // Lo que escribió al registrarse, por si el curso ya no existe
      escuelaEscrita: students.school,
      createdAt: students.createdAt,
    })
    .from(students)
    .leftJoin(courses, eq(students.courseId, courses.id))
    .leftJoin(schools, eq(courses.schoolId, schools.id))
    .leftJoin(modalities, eq(schools.modalityId, modalities.id))
    .where(eq(students.status, "pendiente"))
    .orderBy(asc(students.createdAt), asc(students.fullName));
}

// Aprueba un pendiente. Si viene un nombre, lo corrige antes (por si escribió mal o puso un apodo).
export async function aprobar(db: DB, studentId: string, nombreNuevo?: string) {
  const cambios: Partial<typeof students.$inferInsert> = { status: "aprobado" };
  if (nombreNuevo !== undefined) {
    const nombre = limpiarNombre(nombreNuevo);
    if (!nombre) return { ok: false as const, error: "Escribí un nombre válido." };
    cambios.fullName = nombre;
  }
  const r = await db
    .update(students)
    .set(cambios)
    .where(and(eq(students.id, studentId), eq(students.status, "pendiente")));
  if (r.rowsAffected === 0) return { ok: false as const, error: "Ese alumno ya no está pendiente." };
  return { ok: true as const };
}

// Aprueba de una vez a todos los pendientes de un curso
export async function aprobarCurso(db: DB, courseId: string) {
  const r = await db
    .update(students)
    .set({ status: "aprobado" })
    .where(and(eq(students.courseId, courseId), eq(students.status, "pendiente")));
  return r.rowsAffected;
}

// Rechazar = borrar el registro. El usuario queda libre y se puede registrar de nuevo (y vuelve a quedar pendiente).
// Solo borra si sigue pendiente: nunca borra por error a un alumno aprobado con notas.
export async function rechazar(db: DB, studentId: string) {
  const r = await db.delete(students).where(and(eq(students.id, studentId), eq(students.status, "pendiente")));
  if (r.rowsAffected === 0) return { ok: false as const, error: "Ese alumno ya no está pendiente." };
  return { ok: true as const };
}

// Cambia el nombre de un alumno (sus notas no se tocan)
export async function cambiarNombre(db: DB, studentId: string, nombreNuevo: string) {
  const nombre = limpiarNombre(nombreNuevo);
  if (!nombre) return { ok: false as const, error: "Escribí un nombre válido." };
  const r = await db.update(students).set({ fullName: nombre }).where(eq(students.id, studentId));
  if (r.rowsAffected === 0) return { ok: false as const, error: "No existe el alumno." };
  return { ok: true as const };
}

// Bloquear o desbloquear a un alumno aprobado. Sus notas se conservan.
export async function bloquear(db: DB, studentId: string, bloqueado: boolean) {
  const r = await db
    .update(students)
    .set({ status: bloqueado ? "bloqueado" : "aprobado" })
    .where(and(eq(students.id, studentId), eq(students.status, bloqueado ? "aprobado" : "bloqueado")));
  if (r.rowsAffected === 0) {
    return { ok: false as const, error: bloqueado ? "Solo se puede bloquear a un alumno aprobado." : "Ese alumno no está bloqueado." };
  }
  return { ok: true as const };
}

// Registro de un alumno nuevo: queda "pendiente" hasta que el profe lo apruebe
export async function registrar(
  db: DB,
  datos: { fullName?: unknown; username?: unknown; password?: unknown; courseId?: unknown },
  ahora = Date.now()
) {
  const fullName = limpiarNombre(datos.fullName);
  const username = typeof datos.username === "string" ? datos.username : "";
  const password = typeof datos.password === "string" ? datos.password : "";
  const courseId = typeof datos.courseId === "string" ? datos.courseId : "";
  if (!fullName || !username || !password || !courseId) return { ok: false as const, status: 400, error: "Completá todos los datos." };

  // El curso tiene que existir y estar visible (igual que su escuela y su modalidad)
  const elegido = (
    await db
      .select({ curso: courses, escuela: schools, modalidad: modalities })
      .from(courses)
      .innerJoin(schools, eq(courses.schoolId, schools.id))
      .innerJoin(modalities, eq(schools.modalityId, modalities.id))
      .where(eq(courses.id, courseId))
  )[0];
  if (!elegido || !elegido.curso.isActive || !elegido.escuela.isActive || !elegido.modalidad.isActive) {
    return { ok: false as const, status: 400, error: "Ese curso no está disponible. Elegilo de nuevo." };
  }

  const existente = await db.select({ id: students.id }).from(students).where(eq(students.username, username));
  if (existente.length > 0) return { ok: false as const, status: 409, error: "Ese usuario ya existe. Elegí otro." };

  await db.insert(students).values({
    id: uuid(),
    fullName,
    username,
    passwordHash: await bcrypt.hash(password, 10),
    // Se guardan también los nombres como texto, igual que en los registros viejos
    modality: elegido.modalidad.name,
    school: elegido.escuela.name,
    courseId: elegido.curso.id,
    createdAt: new Date(ahora),
    status: "pendiente",
  });
  return { ok: true as const };
}
