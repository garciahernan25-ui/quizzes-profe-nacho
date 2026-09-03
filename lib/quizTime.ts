export function tiempoInicial(timeLimit: number | null): number | null {
  return timeLimit === null || timeLimit === undefined ? null : timeLimit;
}

export function calcularBonus(timeLimit: number | null, tiempoRestante: number): number {
  if (!timeLimit) return 0;
  return Math.round(tiempoRestante * 5);
}