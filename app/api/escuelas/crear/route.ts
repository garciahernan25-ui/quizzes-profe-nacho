export const dynamic = "force-dynamic";
import { db } from "../../../../lib/db";
import { modalities, schools, courses } from "../../../../lib/db/schema";
import { eq } from "drizzle-orm";
import { v4 as uuid } from "uuid";
import { NextResponse } from "next/server";
import { esAdmin, noAutorizado } from "../../../../lib/adminAuth";
import { TIPOS, limpiarNombre, nombreRepetido } from "../../../../lib/escuelas";

// Crea una modalidad, una escuela (dentro de una modalidad) o un curso (dentro de una escuela)
export async function POST(request: Request) {
  if (!(await esAdmin())) return noAutorizado();

  try {
    const { tipo, nombre, padreId } = await request.json();
    const name = limpiarNombre(nombre);

    if (!TIPOS.includes(tipo) || !name) {
      return NextResponse.json({ ok: false, error: "Falta el nombre" }, { status: 400 });
    }

    // Chequear que el "padre" exista (la modalidad de la escuela, o la escuela del curso)
    if (tipo === "escuela") {
      const padre = await db.select().from(modalities).where(eq(modalities.id, padreId ?? ""));
      if (padre.length === 0) return NextResponse.json({ ok: false, error: "Esa modalidad no existe" }, { status: 400 });
    }
    if (tipo === "curso") {
      const padre = await db.select().from(schools).where(eq(schools.id, padreId ?? ""));
      if (padre.length === 0) return NextResponse.json({ ok: false, error: "Esa escuela no existe" }, { status: 400 });
    }

    if (await nombreRepetido(tipo, name, padreId ?? null)) {
      return NextResponse.json({ ok: false, error: `Ya existe "${name}".` }, { status: 409 });
    }

    const nuevo = { id: uuid(), name, createdAt: new Date() };
    if (tipo === "modalidad") await db.insert(modalities).values(nuevo);
    if (tipo === "escuela") await db.insert(schools).values({ ...nuevo, modalityId: padreId });
    if (tipo === "curso") await db.insert(courses).values({ ...nuevo, schoolId: padreId });

    return NextResponse.json({ ok: true, id: nuevo.id });
  } catch (error) {
    console.error("Error al crear:", error);
    return NextResponse.json({ ok: false, error: "No se pudo crear" }, { status: 500 });
  }
}
