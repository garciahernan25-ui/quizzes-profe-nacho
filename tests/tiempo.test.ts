import { describe, it, expect } from "vitest";
import { tiempoInicial, calcularBonus } from "../lib/quizTime";

describe("tiempoInicial", () => {
  it("devuelve null si no hay límite", () => {
    expect(tiempoInicial(null)).toBeNull();
  });

  it("devuelve 5 para timeLimit 5", () => {
    expect(tiempoInicial(5)).toBe(5);
  });

  it("devuelve 30 para timeLimit 30", () => {
    expect(tiempoInicial(30)).toBe(30);
  });
});

describe("calcularBonus", () => {
  it("devuelve 0 si no hay límite", () => {
    expect(calcularBonus(null, 10)).toBe(0);
  });

  it("devuelve 50 si el tiempo restante es 10 y el límite es 10", () => {
    expect(calcularBonus(10, 10)).toBe(50);
  });

  it("devuelve 0 si el tiempo restante es 0", () => {
    expect(calcularBonus(10, 0)).toBe(0);
  });
});