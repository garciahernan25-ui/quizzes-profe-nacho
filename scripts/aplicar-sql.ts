// Aplica un archivo .sql a la base, todo en una sola transacción:
// si un paso falla, no se aplica ninguno.
// Sin --confirmar solo muestra lo que haría (no toca nada).
// Uso: npx dotenv -e .env.local -- npx tsx scripts/aplicar-sql.ts scripts/sql/0002_escuelas_cursos.sql --confirmar
import { createClient } from "@libsql/client";
import { pasosDelArchivo } from "./pasos-sql";

async function aplicar() {
  const archivo = process.argv[2];
  const confirmar = process.argv.includes("--confirmar");
  if (!archivo) throw new Error("Falta el archivo .sql");

  const pasos = pasosDelArchivo(archivo);

  const url = process.env.TURSO_DATABASE_URL!;
  console.log(`Base: ${url.replace(/\/\/.*@/, "//***@")}`);
  pasos.forEach((p, i) => console.log(`\n[${i + 1}/${pasos.length}]\n${p}`));

  if (!confirmar) {
    console.log("\nModo prueba: no se aplicó nada. Agregá --confirmar para aplicarlo.");
    return;
  }

  const client = createClient({ url, authToken: process.env.TURSO_AUTH_TOKEN });
  await client.batch(pasos, "write");
  console.log(`\nListo: ${pasos.length} pasos aplicados.`);
}

aplicar().catch((e) => {
  console.error("\nNo se aplicó nada. Error:", e.message);
  process.exit(1);
});
