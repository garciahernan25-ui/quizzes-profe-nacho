import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { eq } from "drizzle-orm";
import { crearBase } from "./baseDePrueba";
import * as s from "../lib/db/schema";
import { type DB, verificarAcceso, empezarOContinuar, responder, siguiente, ranking } from "../lib/intentos";
import {
  registrar,
  aprobar,
  aprobarCurso,
  rechazar,
  cambiarNombre,
  bloquear,
  pendientes,
  cantidadPendientes,
  estadoDelAlumno,
  limpiarNombre,
} from "../lib/alumnos";
import { T0, alumno, cargarDatos, jugar } from "./datosDePrueba";

let base: Awaited<ReturnType<typeof crearBase>>;
let db: DB;

beforeEach(async () => {
  base = await crearBase();
  db = base.db;
  await cargarDatos(db);
});

afterEach(() => base.cerrar());

const estado = async (id: string) => estadoDelAlumno(db, id);
const idDe = async (username: string) => (await db.select().from(s.students).where(eq(s.students.username, username)))[0]?.id;

// Tres pendientes en el curso 1 y uno en el curso 2
async function cargarPendientes() {
  await db.insert(s.students).values([
    { ...alumno("p1", "Pendiente Uno", "c1"), status: "pendiente" },
    { ...alumno("p2", "Pendiente Dos", "c1"), status: "pendiente" },
    { ...alumno("p3", "Pendiente Tres", "c1"), status: "pendiente" },
    { ...alumno("p4", "Pendiente Cuatro", "c2"), status: "pendiente" },
  ]);
}

describe("registro", () => {
  it("un alumno nuevo queda pendiente", async () => {
    const r = await registrar(db, { fullName: "  Juan   Pérez ", username: "juanp", password: "1234", courseId: "c1" });
    expect(r.ok).toBe(true);
    const id = await idDe("juanp");
    expect(await estado(id!)).toBe("pendiente");
    // El nombre se guarda sin espacios de más
    expect((await db.select().from(s.students).where(eq(s.students.id, id!)))[0].fullName).toBe("Juan Pérez");
  });

  it("no deja registrar un usuario repetido ni un nombre vacío", async () => {
    expect((await registrar(db, { fullName: "Otra Ana", username: "ana", password: "1", courseId: "c1" })).ok).toBe(false);
    expect((await registrar(db, { fullName: "   ", username: "nuevo", password: "1", courseId: "c1" })).ok).toBe(false);
  });

  it("los alumnos que ya existían quedan aprobados al aplicar el SQL", async () => {
    const otra = await crearBase(async (client) => {
      await client.batch(
        [
          "INSERT INTO modalities (id, name) VALUES ('m', 'M')",
          "INSERT INTO schools (id, modality_id, name) VALUES ('e', 'm', 'E')",
          "INSERT INTO courses (id, school_id, name) VALUES ('x', 'e', 'X')",
          "INSERT INTO students (id, full_name, username, password_hash, modality, school, course_id) VALUES ('viejo1', 'Viejo', 'v1', 'x', 'M', 'E', 'x'), ('viejo2', 'Sin curso', 'v2', 'x', 'M', 'E', NULL)",
        ],
        "write"
      );
    });
    try {
      const filas = await otra.db.select({ id: s.students.id, status: s.students.status }).from(s.students);
      expect(filas.map((f) => f.status)).toEqual(["aprobado", "aprobado"]);
      expect(await cantidadPendientes(otra.db)).toBe(0);
    } finally {
      otra.cerrar();
    }
  });

  it("la versión anterior de la app (que no conoce la columna) sigue registrando alumnos aprobados", async () => {
    await base.client.execute(
      "INSERT INTO students (id, full_name, username, password_hash, modality, school, course_id, created_at) VALUES ('nuevo', 'Nuevo', 'nuevo', 'x', 'Secundaria', 'Escuela 5', 'c1', 1)"
    );
    expect(await estado("nuevo")).toBe("aprobado");
  });
});

describe("el bloqueo lo controla el servidor", () => {
  beforeEach(cargarPendientes);

  it("un pendiente no puede empezar un quiz aunque entre por el link directo", async () => {
    expect((await verificarAcceso(db, "p1", "bio")).tipo).toBe("pendiente");
    expect(await empezarOContinuar(db, "p1", "bio", T0)).toEqual({ tipo: "bloqueado", acceso: { tipo: "pendiente" } });
    expect(await db.select().from(s.attempts)).toHaveLength(0);
  });

  it("un bloqueado no puede seguir respondiendo un intento que dejó a medias", async () => {
    const e = await empezarOContinuar(db, "ana", "bio", T0);
    if (e.tipo !== "pregunta") throw new Error();
    await bloquear(db, "ana", true);
    expect(await responder(db, "ana", e.intentoId, 1, T0 + 1_000)).toEqual({ tipo: "bloqueado", acceso: { tipo: "bloqueado" } });
    expect(await siguiente(db, "ana", e.intentoId, T0 + 2_000)).toEqual({ tipo: "bloqueado", acceso: { tipo: "bloqueado" } });
    expect(await db.select().from(s.attemptAnswers)).toHaveLength(0);
  });

  it("los pendientes y los bloqueados no aparecen en el ranking", async () => {
    await bloquear(db, "beto", true);
    const r = await ranking(db, "bio", "c1");
    expect(r.filas.map((f) => f.nombre).sort()).toEqual(["Ana", "Caro"]);
  });
});

describe("aprobar, editar y rechazar", () => {
  beforeEach(cargarPendientes);

  it("la lista de pendientes trae nombre, curso y escuela, y el contador coincide", async () => {
    const lista = await pendientes(db);
    expect(lista).toHaveLength(4);
    expect(lista.find((p) => p.id === "p4")).toMatchObject({ fullName: "Pendiente Cuatro", curso: "2do B", escuela: "Escuela 5" });
    expect(await cantidadPendientes(db)).toBe(4);
  });

  it("aprobar le deja hacer sus quizzes", async () => {
    expect((await aprobar(db, "p1")).ok).toBe(true);
    expect(await estado("p1")).toBe("aprobado");
    expect((await verificarAcceso(db, "p1", "bio")).tipo).toBe("puede");
    expect(await cantidadPendientes(db)).toBe(3);
  });

  it("editar el nombre y aprobar", async () => {
    expect((await aprobar(db, "p2", "  María  Gómez ")).ok).toBe(true);
    const fila = (await db.select().from(s.students).where(eq(s.students.id, "p2")))[0];
    expect(fila).toMatchObject({ fullName: "María Gómez", status: "aprobado" });
    // Un nombre vacío no se acepta y el alumno sigue pendiente
    expect((await aprobar(db, "p3", "   ")).ok).toBe(false);
    expect(await estado("p3")).toBe("pendiente");
  });

  it("aprobar todos solo aprueba a los pendientes de ESE curso", async () => {
    await bloquear(db, "caro", true);
    expect(await aprobarCurso(db, "c1")).toBe(3);
    expect(await estado("p1")).toBe("aprobado");
    expect(await estado("p3")).toBe("aprobado");
    expect(await estado("p4")).toBe("pendiente");
    // Un bloqueado del mismo curso no se desbloquea
    expect(await estado("caro")).toBe("bloqueado");
  });

  it("rechazar borra el registro y libera el usuario para registrarse de nuevo", async () => {
    expect((await rechazar(db, "p1")).ok).toBe(true);
    expect(await estado("p1")).toBe("no-existe");
    expect((await registrar(db, { fullName: "Nombre Real", username: "p1", password: "1", courseId: "c1" })).ok).toBe(true);
    expect(await estado((await idDe("p1"))!)).toBe("pendiente");
  });

  it("rechazar nunca borra a un alumno aprobado (ni sus notas)", async () => {
    await jugar(db, "ana", "ene", [1]);
    expect((await rechazar(db, "ana")).ok).toBe(false);
    expect(await estado("ana")).toBe("aprobado");
    expect(await db.select().from(s.scores)).toHaveLength(1);
  });

  it("aprobar a alguien que ya no está pendiente no hace nada", async () => {
    await rechazar(db, "p1");
    expect((await aprobar(db, "p1")).ok).toBe(false);
    expect((await aprobar(db, "ana")).ok).toBe(false);
  });
});

describe("cambiar nombre y bloquear desde la ficha", () => {
  it("cambiar el nombre no toca sus notas", async () => {
    await jugar(db, "ana", "ene", [1]);
    expect((await cambiarNombre(db, "ana", "Ana López")).ok).toBe(true);
    expect((await db.select().from(s.students).where(eq(s.students.id, "ana")))[0].fullName).toBe("Ana López");
    expect(await db.select().from(s.scores).where(eq(s.scores.playerName, "ana"))).toHaveLength(1);
  });

  it("bloquear conserva las notas y desbloquear le devuelve el acceso", async () => {
    await jugar(db, "ana", "ene", [1]);
    await bloquear(db, "ana", true);
    expect((await verificarAcceso(db, "ana", "bio")).tipo).toBe("bloqueado");
    expect(await db.select().from(s.scores).where(eq(s.scores.playerName, "ana"))).toHaveLength(1);
    await bloquear(db, "ana", false);
    expect((await verificarAcceso(db, "ana", "bio")).tipo).toBe("puede");
  });

  it("no se puede bloquear a un pendiente (para eso está rechazar)", async () => {
    await cargarPendientes();
    expect((await bloquear(db, "p1", true)).ok).toBe(false);
    expect(await estado("p1")).toBe("pendiente");
  });

  it("los nombres se limpian y tienen un largo máximo", () => {
    expect(limpiarNombre("  Ana   María ")).toBe("Ana María");
    expect(limpiarNombre("x".repeat(81))).toBeNull();
    expect(limpiarNombre(42)).toBeNull();
  });
});
