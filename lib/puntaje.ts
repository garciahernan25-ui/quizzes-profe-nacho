// Puntos del ranking en vivo. NO cambian la nota (la nota es solo correctas / total).

export const PUNTOS_BASE = 100;
export const BONUS_MAXIMO = 100;
// Si el quiz no tiene límite de tiempo, el bonus se calcula como si tuviera 30 segundos
export const VENTANA_SIN_LIMITE_MS = 30_000;
// Margen por lo que tarda internet en llevar la respuesta al servidor
export const GRACIA_MS = 1_000;

// true si la respuesta llegó después del límite (con el margen incluido)
export function seAcaboElTiempo(timeLimit: number | null, elapsedMs: number) {
  if (!timeLimit) return false;
  return elapsedMs > timeLimit * 1000 + GRACIA_MS;
}

// Correcta: 100 + bonus proporcional al tiempo que sobró (0 a 100). Incorrecta: 0.
// Ej: límite 30 s, responde bien en 8 s → sobran 22 s → 100 + 73 = 173
export function puntosDeRespuesta(correcta: boolean, timeLimit: number | null, elapsedMs: number) {
  if (!correcta) return 0;
  const ventana = timeLimit ? timeLimit * 1000 : VENTANA_SIN_LIMITE_MS;
  const sobra = Math.max(0, ventana - elapsedMs);
  return PUNTOS_BASE + Math.round((BONUS_MAXIMO * sobra) / ventana);
}

// Tiempo que le queda al alumno en la pregunta actual (null = sin límite)
export function restanteMs(timeLimit: number | null, elapsedMs: number) {
  if (!timeLimit) return null;
  return Math.max(0, timeLimit * 1000 - elapsedMs);
}
