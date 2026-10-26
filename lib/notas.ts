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
