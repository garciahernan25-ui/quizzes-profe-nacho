export const dynamic = "force-dynamic";
import { db } from "../../../lib/db";
import { modalities, schools, courses } from "../../../lib/db/schema";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

// Pública (la usa el registro): solo lo visible, y solo escuelas que tengan al menos un curso visible
export async function GET() {
  try {
    const listaModalidades = await db.select().from(modalities).where(eq(modalities.isActive, true));
    const listaEscuelas = await db.select().from(schools).where(eq(schools.isActive, true));
    const listaCursos = await db.select().from(courses).where(eq(courses.isActive, true));

    const porNombre = (a: { name: string }, b: { name: string }) => a.name.localeCompare(b.name, "es", { numeric: true });

    const opciones = listaModalidades
      .map((m) => ({
        id: m.id,
        name: m.name,
        escuelas: listaEscuelas
          .filter((e) => e.modalityId === m.id)
          .map((e) => ({
            id: e.id,
            name: e.name,
            cursos: listaCursos
              .filter((c) => c.schoolId === e.id)
              .map((c) => ({ id: c.id, name: c.name }))
              .sort(porNombre),
          }))
          .filter((e) => e.cursos.length > 0)
          .sort(porNombre),
      }))
      .filter((m) => m.escuelas.length > 0)
      .sort(porNombre);

    return NextResponse.json(opciones);
  } catch (error) {
    console.error("Error al listar opciones de registro:", error);
    return NextResponse.json([], { status: 500 });
  }
}
