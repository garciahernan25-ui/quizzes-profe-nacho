import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { eq } from "drizzle-orm";
import { crearBase } from "./baseDePrueba";
import * as s from "../lib/db/schema";
import { type DB, verificarAcceso, habilitarOtroIntento, borrarNota, fichaDelAlumno, notaQueCuenta } from "../lib/intentos";
import { editarNota, quitarEdicion, vistaPreviaRecalculo, aplicarRecalculo, EDITADO_POR } from "../lib/notasEditadas";
import { historialDeEdiciones } from "../lib/ediciones";
import { leerNota } from "../lib/notas";
import { T0, cargarDatos, jugar } from "./datosDePrueba";

let base: Awaited<ReturnType<typeof crearBase>>;
let db: DB;

beforeEach(async () => {
  base = await crearBase();
  db = base.db;
  await cargarDatos(db);
});

afterEach(() => base.cerrar());

const fichaDe = async (id: string, quizId: string) => (await fichaDelAlumno(db, id))!.quizzes.find((q) => q.quizId === quizId)!;

describe("editar nota", () => {
  it("guarda la nota nueva, la original, quién y cuándo", async () => {
    await jugar(db, "ana", "bio", [1, 1, 0]); // 2 de 3 = 6.7
    expect((await editarNota(db, "ana", "bio", 9, T0 + 60_000)).ok).toBe(true);

    const [cambio] = await historialDeEdiciones(db, { studentId: "ana" });
    expect(cambio).toMatchObject({ quizId: "bio", grade: 9, previousGrade: 6.7, editedBy: EDITADO_POR });
    expect(cambio.editedAt.getTime()).toBe(T0 + 60_000);

    const q = await fichaDe("ana", "bio");
    expect(q).toMatchObject({ nota: 9, notaCalculada: 6.7, editada: { nota: 9 } });
    expect(await verificarAcceso(db, "ana", "bio")).toEqual({ tipo: "ya-respondio", nota: 9 });
  });

  it("la editada manda aunque después haga otro intento mejor", async () => {
    await jugar(db, "ana", "bio", [1, 0, 0]);
    await editarNota(db, "ana", "bio", 5, T0 + 60_000);
    await habilitarOtroIntento(db, "ana", "bio", T0 + 70_000);
    await jugar(db, "ana", "bio", [1, 1, 1], 5_000, T0 + 80_000);
    expect(await notaQueCuenta(db, "ana", "bio")).toBe(5);
    expect((await fichaDe("ana", "bio")).notaCalculada).toBe(10);
  });

  it("quitar la edición vuelve a la mejor de los intentos y también queda registrado", async () => {
    await jugar(db, "ana", "bio", [1, 1, 0]);
    await editarNota(db, "ana", "bio", 9, T0 + 60_000);
    expect((await quitarEdicion(db, "ana", "bio", T0 + 70_000)).ok).toBe(true);
    expect(await notaQueCuenta(db, "ana", "bio")).toBe(6.7);
    const historial = await historialDeEdiciones(db, { studentId: "ana" });
    expect(historial.map((h) => [h.grade, h.previousGrade])).toEqual([
      [9, 6.7],
      [null, 9],
    ]);
    expect((await fichaDe("ana", "bio")).editada).toBeNull();
    // No hay nada que quitar dos veces
    expect((await quitarEdicion(db, "ana", "bio")).ok).toBe(false);
  });

  it("una segunda edición guarda como original la nota editada anterior", async () => {
    await jugar(db, "ana", "bio", [1, 1, 0]);
    await editarNota(db, "ana", "bio", 9, T0 + 60_000);
    await editarNota(db, "ana", "bio", 8, T0 + 60_000); // mismo milisegundo: igual queda en orden
    expect(await notaQueCuenta(db, "ana", "bio")).toBe(8);
    expect((await historialDeEdiciones(db, { studentId: "ana" })).map((h) => h.previousGrade)).toEqual([6.7, 9]);
  });

  it("no acepta notas fuera de 0 a 10, y lee la coma como decimal", async () => {
    expect((await editarNota(db, "ana", "bio", 11)).ok).toBe(false);
    expect((await editarNota(db, "ana", "bio", -1)).ok).toBe(false);
    expect(leerNota("8,5")).toBe(8.5);
    expect(leerNota(" 7 ")).toBe(7);
    expect(leerNota("10.0")).toBe(10);
    expect(leerNota("11")).toBeNull();
    expect(leerNota("ocho")).toBeNull();
    expect(leerNota("")).toBeNull();
  });

  it("solo cambia la nota de ese alumno en ese quiz", async () => {
    await jugar(db, "ana", "bio", [1, 1, 0]);
    await jugar(db, "ana", "ene", [0]);
    await jugar(db, "beto", "bio", [1, 1, 0]);
    await editarNota(db, "ana", "bio", 9);
    expect(await notaQueCuenta(db, "ana", "ene")).toBe(0);
    expect(await notaQueCuenta(db, "beto", "bio")).toBe(6.7);
  });

  it("borrar nota borra también la edición (queda como si nunca lo hubiera hecho)", async () => {
    await jugar(db, "ana", "bio", [1, 1, 0]);
    await editarNota(db, "ana", "bio", 9);
    await borrarNota(db, "ana", "bio");
    expect(await historialDeEdiciones(db, { studentId: "ana" })).toHaveLength(0);
    expect(await notaQueCuenta(db, "ana", "bio")).toBeNull();
  });
});

describe("recalcular un quiz al corregir la respuesta correcta", () => {
  // El profe cargó mal la pregunta p3: la correcta era la opción 0, no la 1
  async function corregirP3() {
    await db.update(s.questions).set({ correctIndex: 0 }).where(eq(s.questions.id, "p3"));
  }

  beforeEach(async () => {
    await jugar(db, "ana", "bio", [1, 1, 0]); // 6.7 → con p3 corregida: 10
    await jugar(db, "beto", "bio", [1, 0, 1]); // 6.7 → 3.3
    await jugar(db, "caro", "bio", [0, 0, 0]); // 0 → 3.3, pero tiene la nota editada a mano
    await editarNota(db, "caro", "bio", 5);
    // Eli tiene una nota del sistema anterior (sin respuestas guardadas)
    await base.client.execute(
      "INSERT INTO scores (id, quiz_id, round_id, player_name, score, total_questions, correct_answers, played_at) VALUES ('viejo', NULL, 'r1', 'eli', 50, 2, 1, 1)"
    );
  });

  it("la vista previa muestra quién cambia y cómo, sin tocar nada", async () => {
    await corregirP3();
    const v = await vistaPreviaRecalculo(db, "bio");
    expect(v.respuestasQueCambian).toBe(3);
    expect(v.cambian).toEqual([
      { studentId: "ana", nombre: "Ana", curso: "1ro A", antes: 6.7, despues: 10 },
      { studentId: "beto", nombre: "Beto", curso: "1ro A", antes: 6.7, despues: 3.3 },
    ]);
    expect(v.editadas).toEqual([{ studentId: "caro", nombre: "Caro", curso: "1ro A", antes: 0, despues: 3.3, notaEditada: 5 }]);
    expect(v.viejas).toEqual([{ studentId: "eli", nombre: "Eli", curso: null, nota: 5 }]);
    // Nada cambió todavía
    expect(await notaQueCuenta(db, "ana", "bio")).toBe(6.7);
  });

  it("aplicar cambia notas y puntos, respeta la editada y no toca las viejas", async () => {
    await corregirP3();
    await aplicarRecalculo(db, "bio");

    expect(await notaQueCuenta(db, "ana", "bio")).toBe(10);
    expect(await notaQueCuenta(db, "beto", "bio")).toBe(3.3);
    expect(await notaQueCuenta(db, "caro", "bio")).toBe(5);
    expect((await fichaDe("caro", "bio")).notaCalculada).toBe(3.3);
    // La nota vieja queda tal cual
    expect((await db.select().from(s.scores).where(eq(s.scores.id, "viejo")))[0]).toMatchObject({ score: 50, correctAnswers: 1 });

    // La tabla de notas de siempre (la que lee la versión anterior) también se corrige
    const anaScore = (await db.select().from(s.scores).where(eq(s.scores.playerName, "ana")))[0];
    expect(anaScore).toMatchObject({ correctAnswers: 3, score: 100 });

    // Los puntos del ranking: p3 de Ana, respondida en 5 s de 30 → 100 + 83
    const p3Ana = (await db.select().from(s.attemptAnswers).where(eq(s.attemptAnswers.questionId, "p3"))).find((r) => r.chosenIndex === 0 && r.isCorrect);
    expect(p3Ana?.points).toBe(183);
  });

  it("aplicarlo dos veces no cambia nada la segunda vez", async () => {
    await corregirP3();
    await aplicarRecalculo(db, "bio");
    const otra = await vistaPreviaRecalculo(db, "bio");
    expect(otra.respuestasQueCambian).toBe(0);
    expect(otra.cambian).toEqual([]);
  });

  it("sin cambios en las preguntas no hay nada para recalcular", async () => {
    const v = await vistaPreviaRecalculo(db, "bio");
    expect(v.respuestasQueCambian).toBe(0);
    expect(v.cambian).toEqual([]);
    expect(v.editadas).toEqual([]);
  });

  it("una respuesta que llegó tarde sigue sin valer aunque ahora sea la correcta", async () => {
    await borrarNota(db, "ana", "bio");
    await jugar(db, "ana", "bio", [1, 1, 0], 35_000, T0 + 1_000_000); // todas fuera de tiempo
    await corregirP3();
    await aplicarRecalculo(db, "bio");
    expect(await notaQueCuenta(db, "ana", "bio")).toBe(0);
  });

  it("no toca los otros quizzes", async () => {
    await jugar(db, "ana", "ene", [0]);
    await db.update(s.questions).set({ correctIndex: 0 }).where(eq(s.questions.id, "e1"));
    await aplicarRecalculo(db, "bio");
    expect(await notaQueCuenta(db, "ana", "ene")).toBe(0);
  });
});
