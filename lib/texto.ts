// Para comparar nombres sin que importen mayúsculas, tildes ni espacios de más:
// "Escuela  N°5" y "escuela n°5" cuentan como el mismo nombre.
// (Va en un archivo aparte porque lo usan también las pantallas del navegador)
export function normalizar(texto: string) {
  return texto
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}
