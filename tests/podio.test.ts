import { describe, it, expect } from "vitest";
import { podioAutomatico, primerosTres, terminaronTodos } from "../lib/podio";

const fila = (nombre: string, empezo: boolean, terminado: boolean) => ({ nombre, empezo, terminado });

describe("cuándo aparece el podio solo", () => {
  it("cuando terminaron todos los que empezaron (los que faltan no lo traban)", () => {
    const filas = [fila("Ana", true, true), fila("Beto", true, true), fila("Caro", false, false)];
    expect(terminaronTodos(filas)).toBe(true);
    expect(podioAutomatico(filas, null)).toBe(true);
  });

  it("mientras alguien sigue jugando, no", () => {
    expect(podioAutomatico([fila("Ana", true, true), fila("Beto", true, false)], null)).toBe(false);
  });

  it("si nadie empezó todavía, no", () => {
    expect(podioAutomatico([fila("Ana", false, false), fila("Beto", false, false)], null)).toBe(false);
    expect(podioAutomatico([], null)).toBe(false);
  });

  it("después de 'Volver a la tabla' no vuelve a salir solo hasta que termine alguien más", () => {
    const dos = [fila("Ana", true, true), fila("Beto", true, true), fila("Caro", false, false)];
    expect(podioAutomatico(dos, 2)).toBe(false);
    // Caro arranca tarde: mientras juega, nada
    expect(podioAutomatico([dos[0], dos[1], fila("Caro", true, false)], 2)).toBe(false);
    // Cuando termina, vuelve a salir con ella incluida
    expect(podioAutomatico([dos[0], dos[1], fila("Caro", true, true)], 2)).toBe(true);
  });
});

describe("quiénes suben al podio", () => {
  it("los 3 primeros de la tabla, solo entre los que empezaron", () => {
    const filas = [fila("Ana", true, true), fila("Beto", true, true), fila("Caro", true, true), fila("Dani", true, true), fila("Eli", false, false)];
    expect(primerosTres(filas).map((f) => f.nombre)).toEqual(["Ana", "Beto", "Caro"]);
  });

  it("si jugaron menos de 3, muestra los que haya", () => {
    expect(primerosTres([fila("Ana", true, true), fila("Beto", false, false)]).map((f) => f.nombre)).toEqual(["Ana"]);
  });
});
