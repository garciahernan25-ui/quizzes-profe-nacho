export const dynamic = "force-dynamic";
import { db } from "../../../../lib/db";
import { modalities, schools, courses } from "../../../../lib/db/schema";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { esAdmin, noAutorizado } from "../../../../lib/adminAuth";
import { TIPOS, limpiarNombre, nombreRepetido } from "../../../../lib/escuelas";

// Renombra, oculta/muestra, o (solo escuelas) cambia de modalidad
export async function POST(request: Request) {
  if (!(await esAdmin())) return noAutorizado();

  try {
    const { tipo, id, nombre, activo, modalidadId } = await request.json();
    if (!TIPOS.includes(tipo) || !id) {
      return NextResponse.json({ ok: false, error: "Faltan datos" }, { status: 400 });
    }

    // Buscar el elemento actual para saber quién es su "padre"
    const actual =
      tipo === "modalidad"
        ? (await db.select().from(modalities).where(eq(modalities.id, id)))[0]
        : tipo === "escuela"
          ? (await db.select().from(schools).where(eq(schools.id, id)))[0]
          : (await db.select().from(courses).where(eq(courses.id, id)))[0];
    if (!actual) return NextResponse.json({ ok: false, error: "No existe" }, { status: 404 });

    const cambios: { name?: string; isActive?: boolean; modalityId?: string } = {};

    if (typeof activo === "boolean") cambios.isActive = activo;

    if (tipo === "escuela" && modalidadId) {
      const modalidad = await db.select().from(modalities).where(eq(modalities.id, modalidadId));
      if (modalidad.length === 0) return NextResponse.json({ ok: false, error: "Esa modalidad no existe" }, { status: 400 });
      cambios.modalityId = modalidadId;
    }

    if (nombre !== undefined) {
      const name = limpiarNombre(nombre);
      if (!name) return NextResponse.json({ ok: false, error: "El nombre no puede quedar vacío" }, { status: 400 });
      cambios.name = name;
    }

    // Si cambia el nombre o la modalidad, chequear que no quede repetido
    if (cambios.name || cambios.modalityId) {
      const padreId =
        tipo === "escuela" ? (cambios.modalityId ?? (actual as typeof schools.$inferSelect).modalityId)
        : tipo === "curso" ? (actual as typeof courses.$inferSelect).schoolId
        : null;
      if (await nombreRepetido(tipo, cambios.name ?? actual.name, padreId, id)) {
        return NextResponse.json({ ok: false, error: `Ya existe "${cambios.name ?? actual.name}".` }, { status: 409 });
      }
    }

    if (Object.keys(cambios).length === 0) return NextResponse.json({ ok: true });

    if (tipo === "modalidad") await db.update(modalities).set(cambios).where(eq(modalities.id, id));
    if (tipo === "escuela") await db.update(schools).set(cambios).where(eq(schools.id, id));
    if (tipo === "curso") await db.update(courses).set(cambios).where(eq(courses.id, id));

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Error al editar:", error);
    return NextResponse.json({ ok: false, error: "No se pudo guardar" }, { status: 500 });
  }
}
