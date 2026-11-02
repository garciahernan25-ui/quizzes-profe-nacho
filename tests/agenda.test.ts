import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { crearBase } from "./baseDePrueba";
import type { DB } from "../lib/intentos";
import { notasParaAgenda, tokenAgendaValido } from "../lib/agenda";
import { editarNota } from "../lib/notasEditadas";
import { T0, cargarDatos, jugar } from "./datosDePrueba";

let base: Awaited<ReturnType<typeof crearBase>>;
let db: DB;

beforeEach(async () => {
  base = await crearBase();
  db = base.db;
  await cargarDatos(db);
});

afterEach(() => base.cerrar());

const TOKEN = "x".repeat(40);

describe("token de la agenda", () => {
  it("entra solo con el token exacto", () => {
    expect(tokenAgendaValido(`Bearer ${TOKEN}`, TOKEN)).toBe(true);
    expect(tokenAgendaValido(`Bearer ${TOKEN}y`, TOKEN)).toBe(false);
    expect(tokenAgendaValido(TOKEN, TOKEN)).toBe(false);
    expect(tokenAgendaValido(null, TOKEN)).toBe(false);
  });
  it("sin token configurado (o muy corto) no entra nadie", () => {
    expect(tokenAgendaValido("Bearer ", undefined)).toBe(false);
    expect(tokenAgendaValido("Bearer corto", "corto")).toBe(false);
  });
});

describe("notas para la agenda", () => {
  it("manda la nota que cuenta de cada alumno en cada quiz, con su curso", async () => {
    await jugar(db, "ana", "bio", [1, 1, 0]); // 6.7
    await jugar(db, "beto", "ene", [1]); // 10
    await editarNota(db, "beto", "ene", 8, T0 + 60_000);

    const r = await notasParaAgenda(db);
    expect(r.quizzes.map((q) => q.title).sort()).toEqual(["Biología", "Energía"]);
    expect(r.notas).toContainEqual(expect.objectContaining({ studentId: "ana", quizId: "bio", nota: 6.7, editada: false }));
    expect(r.notas).toContainEqual(expect.objectContaining({ studentId: "beto", quizId: "ene", nota: 8, editada: true }));
    expect(r.notas).toHaveLength(2);
    expect(r.alumnos.find((a) => a.id === "ana")).toMatchObject({ nombre: "Ana", curso: "1ro A", escuela: "Escuela 5" });
  });
});
