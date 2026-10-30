// Cuándo se muestra el podio en el ranking en vivo. Sin base de datos: lo usa la pantalla del navegador.

type Fila = { empezo: boolean; terminado: boolean };

export function cantidadTerminados(filas: Fila[]) {
  return filas.filter((f) => f.terminado).length;
}

// Terminaron todos los que empezaron (los que faltan o no arrancaron no traban el podio)
export function terminaronTodos(filas: Fila[]) {
  const empezaron = filas.filter((f) => f.empezo);
  return empezaron.length > 0 && empezaron.every((f) => f.terminado);
}

// ¿Aparece el podio solo?
// terminadosAlCerrar = cuántos habían terminado cuando el profe tocó "Volver a la tabla" (null = nunca lo cerró).
// Después de cerrarlo no vuelve a salir solo hasta que termine alguien más.
export function podioAutomatico(filas: Fila[], terminadosAlCerrar: number | null) {
  if (!terminaronTodos(filas)) return false;
  return terminadosAlCerrar === null || cantidadTerminados(filas) > terminadosAlCerrar;
}

// Los 3 primeros (la tabla ya viene ordenada). Solo cuentan los que empezaron.
export function primerosTres<T extends Fila>(filas: T[]) {
  return filas.filter((f) => f.empezo).slice(0, 3);
}
