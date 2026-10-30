import { readFileSync } from "fs";

// Separa un archivo .sql en pasos (por "--> statement-breakpoint") y les saca los comentarios.
// Lo usan aplicar-sql.ts y los tests, así los tests aplican el SQL igual que en producción.
export function pasosDelArchivo(archivo: string) {
  return readFileSync(archivo, "utf8")
    .split("--> statement-breakpoint")
    .map((p) => p.replace(/^\s*--.*$/gm, "").trim()) // saco los comentarios
    .filter((p) => p.length > 0);
}
