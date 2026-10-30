// Cálculo de notas, en un solo lugar para que el seguimiento y los promedios usen la misma regla

// Nota de una partida en escala 0 a 10
export function notaDePartida(correctas: number, total: number) {
  return total > 0 ? (correctas / total) * 10 : 0;
}

// Promedio redondeado a 1 decimal. Devuelve null si no hay notas (no es lo mismo que un 0).
export function promedio(notas: number[]) {
  if (notas.length === 0) return null;
  const suma = notas.reduce((acc, n) => acc + n, 0);
  return Math.round((suma / notas.length) * 10) / 10;
}

// Nota de un alumno en un quiz.
// - Las notas del sistema anterior (por sección, sin intento) se promedian como antes: cuentan como un intento.
// - Si hay varios intentos, cuenta la MEJOR.
export function notaDelQuiz(partidas: { attemptId: string | null; nota: number }[]) {
  const notas: number[] = [];
  const viejas = promedio(partidas.filter((p) => !p.attemptId).map((p) => p.nota));
  if (viejas !== null) notas.push(viejas);
  for (const p of partidas) if (p.attemptId) notas.push(Math.round(p.nota * 10) / 10);
  return notas.length === 0 ? null : Math.max(...notas);
}

// Si el admin editó la nota a mano, manda esa (aunque después haya otro intento mejor)
export function notaFinal(calculada: number | null, editada: number | null | undefined) {
  return editada ?? calculada;
}

// Lee una nota escrita a mano ("8", "8,5", "8.5"). Devuelve null si no es un número de 0 a 10.
// (La usan la ficha del navegador y la API, para que las dos acepten lo mismo)
export function leerNota(texto: string) {
  const limpio = texto.trim().replace(",", ".");
  if (!/^\d{1,2}(\.\d+)?$/.test(limpio)) return null;
  const nota = Math.round(Number(limpio) * 10) / 10;
  return nota >= 0 && nota <= 10 ? nota : null;
}
