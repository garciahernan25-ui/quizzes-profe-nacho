import { describe, it, expect } from "vitest";
import { puntosDeRespuesta, seAcaboElTiempo, restanteMs } from "../lib/puntaje";
import { notaDelQuiz, notaDePartida } from "../lib/notas";

describe("puntos del ranking", () => {
  it("correcta en 8 s de 30: 100 + 73 = 173", () => {
    expect(puntosDeRespuesta(true, 30, 8_000)).toBe(173);
  });

  it("incorrecta no suma nada, aunque sea rapidísima", () => {
    expect(puntosDeRespuesta(false, 30, 500)).toBe(0);
  });

  it("instantánea suma el máximo (200) y al límite justo solo la base (100)", () => {
    expect(puntosDeRespuesta(true, 30, 0)).toBe(200);
    expect(puntosDeRespuesta(true, 30, 30_000)).toBe(100);
  });

  it("el bonus es proporcional: con 10 s de límite, responder en 2 s da 100 + 80", () => {
    expect(puntosDeRespuesta(true, 10, 2_000)).toBe(180);
  });

  it("sin límite de tiempo el bonus se calcula sobre 30 s", () => {
    expect(puntosDeRespuesta(true, null, 8_000)).toBe(173);
    expect(puntosDeRespuesta(true, null, 45_000)).toBe(100);
  });
});

describe("corte por tiempo (lo mide el servidor)", () => {
  it("hay 1 segundo de margen por la demora de internet", () => {
    expect(seAcaboElTiempo(30, 30_900)).toBe(false);
    expect(seAcaboElTiempo(30, 31_100)).toBe(true);
  });

  it("un quiz sin límite nunca corta", () => {
    expect(seAcaboElTiempo(null, 10 * 60_000)).toBe(false);
    expect(restanteMs(null, 5_000)).toBeNull();
  });

  it("el tiempo que queda nunca es negativo", () => {
    expect(restanteMs(30, 12_000)).toBe(18_000);
    expect(restanteMs(30, 50_000)).toBe(0);
  });
});

describe("nota del quiz (no depende del tiempo)", () => {
  it("es correctas / total en escala 0 a 10", () => {
    expect(notaDePartida(8, 10)).toBe(8);
    expect(notaDePartida(0, 0)).toBe(0);
  });

  it("con varios intentos cuenta la mejor", () => {
    expect(notaDelQuiz([{ attemptId: "a", nota: 6 }, { attemptId: "b", nota: 9 }, { attemptId: "c", nota: 7 }])).toBe(9);
  });

  it("las notas viejas por sección se promedian como antes y cuentan como un intento", () => {
    expect(notaDelQuiz([{ attemptId: null, nota: 6 }, { attemptId: null, nota: 9 }])).toBe(7.5);
    expect(notaDelQuiz([{ attemptId: null, nota: 6 }, { attemptId: null, nota: 9 }, { attemptId: "x", nota: 7 }])).toBe(7.5);
    expect(notaDelQuiz([{ attemptId: null, nota: 6 }, { attemptId: "x", nota: 8 }])).toBe(8);
  });

  it("sin partidas no hay nota (no es un 0)", () => {
    expect(notaDelQuiz([])).toBeNull();
  });
});
