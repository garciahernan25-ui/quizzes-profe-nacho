// Respaldo de SOLO LECTURA: copia todas las tablas a un archivo JSON en /backups.
// Uso: npx dotenv -e .env.local -- npx tsx scripts/respaldo.ts
// El archivo tiene datos de alumnos: no se sube a git (está en .gitignore).
import { createClient } from "@libsql/client";
import { mkdirSync, writeFileSync } from "fs";

async function respaldar() {
  const client = createClient({
    url: process.env.TURSO_DATABASE_URL!,
    authToken: process.env.TURSO_AUTH_TOKEN!,
  });

  const tablas = await client.execute(
    "SELECT name, sql FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%' ORDER BY name"
  );

  const respaldo: Record<string, { sql: unknown; filas: unknown[] }> = {};
  for (const t of tablas.rows) {
    const nombre = String(t.name);
    const filas = await client.execute(`SELECT * FROM "${nombre}"`);
    respaldo[nombre] = { sql: t.sql, filas: filas.rows };
    console.log(`${nombre}: ${filas.rows.length} filas`);
  }

  mkdirSync("backups", { recursive: true });
  const archivo = `backups/respaldo-${new Date().toISOString().replace(/[:.]/g, "-")}.json`;
  writeFileSync(archivo, JSON.stringify(respaldo, null, 2));
  console.log(`Respaldo guardado en ${archivo}`);
}

respaldar().catch((e) => {
  console.error(e);
  process.exit(1);
});
