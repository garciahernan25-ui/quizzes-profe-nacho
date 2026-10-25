import { describe, it, expect } from "vitest";

function calcularNota(correctas: number, total: number): number {
  return (correctas / total) * 10;
}

describe("calcularNota", () => {
  it("devuelve 10 si todas son correctas", () => {
    expect(calcularNota(7, 7)).toBe(10);
  });

  it("devuelve 0 si ninguna es correcta", () => {
    expect(calcularNota(0, 5)).toBe(0);
  });

  it("devuelve 5 si la mitad son correctas", () => {
    expect(calcularNota(3, 6)).toBe(5);
  });
});