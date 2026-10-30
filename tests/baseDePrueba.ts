// Base de prueba: un archivo temporal que se borra al terminar. Nunca toca la base real.
import { createClient, type Client } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import { mkdtempSync, rmSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";
import * as schema from "../lib/db/schema";
import { pasosDelArchivo } from "../scripts/pasos-sql";
import type { DB } from "../lib/intentos";

export async function crearBase(antesDeLaEtapa3?: (client: Client) => Promise<void>) {
  const carpeta = mkdtempSync(join(tmpdir(), "quizzes-test-"));
  const client = createClient({ url: `file:${join(carpeta, "test.db").replace(/\\/g, "/")}` });
  // Turso revisa las claves foráneas: la base de prueba también
  await client.execute("PRAGMA foreign_keys = ON");

  await client.batch(pasosDelArchivo("tests/base-produccion.sql"), "write");
  await client.batch(pasosDelArchivo("scripts/sql/0002_escuelas_cursos.sql"), "write");
  if (antesDeLaEtapa3) await antesDeLaEtapa3(client);
  await client.batch(pasosDelArchivo("scripts/sql/0003_intentos_cursos.sql"), "write");

  const db = drizzle(client, { schema }) as unknown as DB;
  return {
    client,
    db,
    cerrar() {
      client.close();
      try {
        rmSync(carpeta, { recursive: true, force: true });
      } catch {
        // En Windows a veces el archivo sigue tomado un instante: queda en la carpeta temporal del sistema
      }
    },
  };
}
