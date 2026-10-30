import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { and, eq } from "drizzle-orm";
import { crearBase } from "./baseDePrueba";
import * as s from "../lib/db/schema";
import {
  type DB,
  verificarAcceso,
  empezarOContinuar,
  responder,
  habilitarOtroIntento,
  borrarNota,
  ranking,
  fichaDelAlumno,
} from "../lib/intentos";

import { T0, cargarDatos as cargar, jugar as jugarEn } from "./datosDePrueba";

let base: Awaited<ReturnType<typeof crearBase>>;
let db: DB;

const cargarDatos = () => cargar(db);
const jugar = (studentId: string, quizId: string, elegidas: (number | null)[], cadaMs?: number, desde?: number) =>
  jugarEn(db, studentId, quizId, elegidas, cadaMs, desde);

beforeEach(async () => {
  base = await crearBase();
  db = base.db;
  await cargarDatos();
});

afterEach(() => base.cerrar());

describe("quién puede hacer cada quiz", () => {
  it("solo los cursos habilitados", async () => {
    expect((await verificarAcceso(db, "ana", "bio")).tipo).toBe("puede");
    expect((await verificarAcceso(db, "dani", "bio")).tipo).toBe("no-habilitado");
  });

  it("un alumno sin curso no puede hacer ninguno", async () => {
    expect((await verificarAcceso(db, "eli", "bio")).tipo).toBe("sin-curso");
    expect((await empezarOContinuar(db, "eli", "ene", T0)).tipo).toBe("bloqueado");
  });

  it("una cookie de un alumno que no existe no sirve", async () => {
    expect((await verificarAcceso(db, "inventado", "bio")).tipo).toBe("sin-cuenta");
  });
});

describe("el juego lo maneja el servidor", () => {
  it("las preguntas salen en orden de sección y sin la respuesta correcta", async () => {
    const e = await empezarOContinuar(db, "ana", "bio", T0);
    expect(e.tipo).toBe("pregunta");
    if (e.tipo !== "pregunta") return;
    expect(e.pregunta.question).toBe("p1");
    expect(e.pregunta.total).toBe(3);
    expect(e.pregunta).not.toHaveProperty("correctIndex");
    expect(JSON.stringify(e)).not.toContain("correctIndex");
  });

  it("el tiempo lo mide el servidor: correcta en 8 s = 173 puntos", async () => {
    const e = await empezarOContinuar(db, "ana", "bio", T0);
    if (e.tipo !== "pregunta") throw new Error();
    const r = await responder(db, "ana", e.intentoId, 1, T0 + 8_000);
    expect(r).toMatchObject({ tipo: "respuesta", correcta: true, puntosGanados: 173 });
  });

  it("una respuesta correcta que llega tarde no vale", async () => {
    const e = await empezarOContinuar(db, "ana", "bio", T0);
    if (e.tipo !== "pregunta") throw new Error();
    const r = await responder(db, "ana", e.intentoId, 1, T0 + 32_000);
    expect(r).toMatchObject({ tipo: "respuesta", correcta: false, puntosGanados: 0 });
  });

  it("recargar la página no reinicia el reloj", async () => {
    const e = await empezarOContinuar(db, "ana", "bio", T0);
    if (e.tipo !== "pregunta") throw new Error();
    // "Recarga" a los 10 s: sigue en la misma pregunta, con 20 s
    const recarga = await empezarOContinuar(db, "ana", "bio", T0 + 10_000);
    expect(recarga).toMatchObject({ tipo: "pregunta", intentoId: e.intentoId, pregunta: { numero: 1, restanteMs: 20_000 } });
    // "Recarga" a los 40 s: la primera se venció (cuenta mal) y ya está en la segunda
    const tarde = await empezarOContinuar(db, "ana", "bio", T0 + 40_000);
    expect(tarde).toMatchObject({ tipo: "pregunta", intentoId: e.intentoId, pregunta: { numero: 2, restanteMs: 30_000 } });
    const respuestas = await db.select().from(s.attemptAnswers);
    expect(respuestas).toHaveLength(1);
    expect(respuestas[0]).toMatchObject({ questionId: "p1", chosenIndex: null, isCorrect: false, points: 0 });
  });

  it("responder dos veces la misma pregunta (doble clic) no suma dos veces", async () => {
    const e = await empezarOContinuar(db, "ana", "bio", T0);
    if (e.tipo !== "pregunta") throw new Error();
    await responder(db, "ana", e.intentoId, 1, T0 + 2_000);
    const otra = await responder(db, "ana", e.intentoId, 0, T0 + 3_000);
    expect(otra).toMatchObject({ tipo: "respuesta", correcta: true });
    expect(await db.select().from(s.attemptAnswers)).toHaveLength(1);
  });

  it("un alumno no puede responder en el intento de otro", async () => {
    const e = await empezarOContinuar(db, "ana", "bio", T0);
    if (e.tipo !== "pregunta") throw new Error();
    expect(await responder(db, "beto", e.intentoId, 1, T0 + 1_000)).toEqual({ tipo: "no-encontrado" });
  });

  it("la nota es correctas / total y no depende del tiempo", async () => {
    await jugar("ana", "bio", [1, 1, 0], 1_000); // rápida: 2 de 3
    await jugar("beto", "bio", [1, 1, 0], 25_000); // lenta: 2 de 3
    const notas = await db.select().from(s.scores);
    expect(notas.map((n) => n.correctAnswers)).toEqual([2, 2]);
    expect(notas.every((n) => n.score === 67 && n.attemptId !== null && n.quizId === "bio")).toBe(true);
  });
});

describe("un solo intento por quiz", () => {
  it("después de terminar, no puede volver a entrar y ve su nota", async () => {
    await jugar("ana", "bio", [1, 1, 0]);
    expect(await verificarAcceso(db, "ana", "bio")).toEqual({ tipo: "ya-respondio", nota: 6.7 });
    expect(await empezarOContinuar(db, "ana", "bio", T0 + 100_000)).toMatchObject({ tipo: "bloqueado", acceso: { tipo: "ya-respondio" } });
    expect(await db.select().from(s.attempts)).toHaveLength(1);
  });

  it("terminar un quiz no bloquea los otros quizzes ni a los compañeros", async () => {
    await jugar("ana", "bio", [1, 1, 1]);
    expect((await verificarAcceso(db, "ana", "ene")).tipo).toBe("puede");
    expect((await verificarAcceso(db, "beto", "bio")).tipo).toBe("puede");
  });

  it("dos pestañas que empiezan al mismo tiempo crean un solo intento", async () => {
    const [a, b] = await Promise.all([empezarOContinuar(db, "ana", "bio", T0), empezarOContinuar(db, "ana", "bio", T0)]);
    expect(a.tipo).toBe("pregunta");
    expect(b.tipo).toBe("pregunta");
    expect(await db.select().from(s.attempts)).toHaveLength(1);
  });

  it("una nota del sistema anterior cuenta como que ya lo hizo, y se conserva", async () => {
    await db.insert(s.scores).values([
      { id: "v1", roundId: "r1", playerName: "ana", score: 60, totalQuestions: 5, correctAnswers: 3, playedAt: new Date(T0) },
      { id: "v2", roundId: "r2", playerName: "ana", score: 100, totalQuestions: 5, correctAnswers: 5, playedAt: new Date(T0) },
    ]);
    expect(await verificarAcceso(db, "ana", "bio")).toEqual({ tipo: "ya-respondio", nota: 8 });
    expect((await verificarAcceso(db, "ana", "ene")).tipo).toBe("puede");
  });
});

describe("habilitar otro intento", () => {
  it("le permite volver a hacerlo y cuenta la mejor nota", async () => {
    await jugar("ana", "bio", [1, 1, 0]); // 6.7
    expect(await habilitarOtroIntento(db, "ana", "bio", T0)).toEqual({ ok: true });
    await jugar("ana", "bio", [1, 0, 0], 5_000, T0 + 1_000_000); // 3.3: peor
    expect(await verificarAcceso(db, "ana", "bio")).toEqual({ tipo: "ya-respondio", nota: 6.7 });

    const ficha = await fichaDelAlumno(db, "ana");
    const bio = ficha!.quizzes.find((q) => q.quizId === "bio")!;
    expect(bio.nota).toBe(6.7);
    expect(bio.intentos.map((i) => i.nota)).toEqual([6.7, 3.3]);
  });

  it("no suma intentos de más si ya tiene uno disponible", async () => {
    expect((await habilitarOtroIntento(db, "ana", "bio", T0)).ok).toBe(false);
    await jugar("ana", "bio", [1, 1, 1]);
    expect((await habilitarOtroIntento(db, "ana", "bio", T0)).ok).toBe(true);
    expect((await habilitarOtroIntento(db, "ana", "bio", T0)).ok).toBe(false);
    expect(await db.select().from(s.extraAttempts)).toHaveLength(1);
  });

  it("solo afecta a ese alumno y ese quiz", async () => {
    await jugar("ana", "bio", [1, 1, 1]);
    await jugar("ana", "ene", [1]);
    await jugar("beto", "bio", [1, 1, 1]);
    await habilitarOtroIntento(db, "ana", "bio", T0);
    expect((await verificarAcceso(db, "ana", "bio")).tipo).toBe("puede");
    expect((await verificarAcceso(db, "ana", "ene")).tipo).toBe("ya-respondio");
    expect((await verificarAcceso(db, "beto", "bio")).tipo).toBe("ya-respondio");
  });

  it("también sirve para alumnos con nota del sistema anterior", async () => {
    await db.insert(s.scores).values({ id: "v1", roundId: "r1", playerName: "ana", score: 40, totalQuestions: 5, correctAnswers: 2, playedAt: new Date(T0) });
    await habilitarOtroIntento(db, "ana", "bio", T0);
    await jugar("ana", "bio", [1, 1, 1]);
    expect(await verificarAcceso(db, "ana", "bio")).toEqual({ tipo: "ya-respondio", nota: 10 });
  });
});

describe("borrar nota", () => {
  it("borra todo lo de ese alumno en ese quiz y puede volver a hacerlo", async () => {
    await db.insert(s.scores).values({ id: "v1", roundId: "r1", playerName: "ana", score: 40, totalQuestions: 5, correctAnswers: 2, playedAt: new Date(T0) });
    await habilitarOtroIntento(db, "ana", "bio", T0);
    await jugar("ana", "bio", [1, 1, 1]);

    await borrarNota(db, "ana", "bio");

    const deAna = and(eq(s.attempts.studentId, "ana"), eq(s.attempts.quizId, "bio"));
    expect(await db.select().from(s.attempts).where(deAna)).toHaveLength(0);
    expect(await db.select().from(s.attemptAnswers)).toHaveLength(0);
    expect(await db.select().from(s.scores).where(eq(s.scores.playerName, "ana"))).toHaveLength(0);
    expect(await db.select().from(s.extraAttempts)).toHaveLength(0);
    expect(await verificarAcceso(db, "ana", "bio")).toEqual({ tipo: "puede", intentoEnCurso: null });
  });

  it("nunca toca a otros alumnos ni otros quizzes", async () => {
    await jugar("ana", "bio", [1, 1, 1]);
    await jugar("ana", "ene", [1]);
    await jugar("beto", "bio", [1, 0, 0]);
    await db.insert(s.scores).values({ id: "v-beto", roundId: "r1", playerName: "beto", score: 50, totalQuestions: 2, correctAnswers: 1, playedAt: new Date(T0) });

    await borrarNota(db, "ana", "bio");

    const notas = await db.select().from(s.scores);
    expect(notas.map((n) => `${n.playerName}/${n.quizId ?? n.roundId}`).sort()).toEqual(["ana/ene", "beto/bio", "beto/r1"]);
    expect((await verificarAcceso(db, "ana", "ene")).tipo).toBe("ya-respondio");
    expect((await verificarAcceso(db, "beto", "bio")).tipo).toBe("ya-respondio");
    // Las respuestas de Beto siguen ahí (el ranking las usa)
    expect(await db.select().from(s.attemptAnswers)).toHaveLength(4);
  });

  it("borra también un intento que quedó a medias", async () => {
    await empezarOContinuar(db, "ana", "bio", T0);
    await borrarNota(db, "ana", "bio");
    expect(await db.select().from(s.attempts)).toHaveLength(0);
  });
});

describe("ranking en vivo", () => {
  it("ordena por puntos; si empatan, gana el que tardó menos; los que no empezaron van al final", async () => {
    await jugar("ana", "bio", [1, 1, 1], 20_000); // 3 correctas lentas
    await jugar("beto", "bio", [1, 1, 1], 2_000); // 3 correctas rápidas
    // Caro no empezó. Dani es de otro curso.
    await jugar("dani", "ene", [1]).catch(() => {});

    const r = await ranking(db, "bio", "c1");
    expect(r.totalPreguntas).toBe(3);
    expect(r.filas.map((f) => f.nombre)).toEqual(["Beto", "Ana", "Caro"]);
    expect(r.filas[0]).toMatchObject({ puntos: 3 * 193, respondidas: 3, terminado: true });
    expect(r.filas[2]).toMatchObject({ empezo: false, puntos: 0, respondidas: 0 });
  });

  it("se mueve mientras responden (muestra el intento en curso)", async () => {
    const e = await empezarOContinuar(db, "ana", "bio", T0);
    if (e.tipo !== "pregunta") throw new Error();
    await responder(db, "ana", e.intentoId, 1, T0 + 8_000);
    const r = await ranking(db, "bio", "c1");
    expect(r.filas[0]).toMatchObject({ nombre: "Ana", puntos: 173, respondidas: 1, terminado: false });
  });

  it("empates exactos de puntos y tiempo: por nombre", async () => {
    await jugar("caro", "bio", [1, 1, 1], 5_000);
    await jugar("ana", "bio", [1, 1, 1], 5_000);
    const r = await ranking(db, "bio", "c1");
    expect(r.filas.slice(0, 2).map((f) => f.nombre)).toEqual(["Ana", "Caro"]);
  });
});

describe("compatibilidad con la base", () => {
  it("al aplicar el SQL, cada quiz publicado queda habilitado para todos los cursos", async () => {
    const otra = await crearBase(async (client) => {
      await client.batch(
        [
          "INSERT INTO quizzes (id, title, slug, is_published) VALUES ('pub', 'Publicado', 'pub', 1), ('bor', 'Borrador', 'bor', 0)",
          "INSERT INTO modalities (id, name) VALUES ('m', 'M')",
          "INSERT INTO schools (id, modality_id, name) VALUES ('e', 'm', 'E')",
          "INSERT INTO courses (id, school_id, name, is_active) VALUES ('x', 'e', 'X', 1), ('y', 'e', 'Y', 0)",
        ],
        "write"
      );
    });
    try {
      const filas = await otra.db.select().from(s.quizCourses);
      expect(filas.map((f) => `${f.quizId}/${f.courseId}`).sort()).toEqual(["pub/x", "pub/y"]);
    } finally {
      otra.cerrar();
    }
  });

  it("la versión anterior de la app sigue funcionando con la base nueva", async () => {
    // Lo que hacía la versión anterior, con sus columnas exactas (sin attempt_id)
    await base.client.execute(
      "INSERT INTO scores (id, quiz_id, round_id, player_name, score, total_questions, correct_answers, played_at) VALUES ('viejo', NULL, 'r1', 'ana', 50, 2, 1, 1)"
    );
    await jugar("beto", "bio", [1, 1, 1]);
    const seguimientoViejo = await base.client.execute(
      "SELECT scores.player_name, scores.correct_answers, scores.total_questions, scores.quiz_id, rounds.quiz_id AS quiz_seccion FROM scores LEFT JOIN rounds ON scores.round_id = rounds.id"
    );
    // Ve la nota vieja y la nueva (la nueva tiene el quiz directo, que la versión anterior ya sabía leer)
    expect(seguimientoViejo.rows.map((r) => `${r.player_name}/${r.quiz_seccion ?? r.quiz_id}`).sort()).toEqual(["ana/bio", "beto/bio"]);
  });

  it("borrar un alumno o un quiz (como lo hace la versión anterior) borra también sus intentos", async () => {
    await jugar("ana", "bio", [1, 1, 1]);
    await jugar("beto", "ene", [1]);
    await habilitarOtroIntento(db, "ana", "bio", T0);

    await base.client.execute("DELETE FROM students WHERE id = 'ana'");
    expect(await db.select().from(s.attempts).where(eq(s.attempts.studentId, "ana"))).toHaveLength(0);
    expect(await db.select().from(s.extraAttempts)).toHaveLength(0);

    await base.client.batch(["DELETE FROM scores WHERE quiz_id = 'ene'", "DELETE FROM rounds WHERE quiz_id = 'ene'", "DELETE FROM quizzes WHERE id = 'ene'"], "write");
    expect(await db.select().from(s.attempts)).toHaveLength(0);
    expect(await db.select().from(s.quizCourses).where(eq(s.quizCourses.quizId, "ene"))).toHaveLength(0);
  });
});
