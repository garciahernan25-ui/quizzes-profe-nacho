export const dynamic = "force-dynamic";
import { db } from "../../../../lib/db";
import { modalities, schools, courses } from "../../../../lib/db/schema";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { esAdmin, noAutorizado } from "../../../../lib/adminAuth";
import { TIPOS, motivoParaNoBorrar } from "../../../../lib/escuelas";

// Borra solo si está vacío: una modalidad sin escuelas, una escuela sin cursos, un curso sin alumnos.
// Si no, conviene ocultarlo (así no se pierde nada).
export async function POST(request: Request) {
  if (!(await esAdmin())) return noAutorizado();

  try {
    const { tipo, id } = await request.json();
    if (!TIPOS.includes(tipo) || !id) {
      return NextResponse.json({ ok: false, error: "Faltan datos" }, { status: 400 });
    }

    const motivo = await motivoParaNoBorrar(tipo, id);
    if (motivo) return NextResponse.json({ ok: false, error: motivo }, { status: 409 });

    if (tipo === "modalidad") await db.delete(modalities).where(eq(modalities.id, id));
    if (tipo === "escuela") await db.delete(schools).where(eq(schools.id, id));
    if (tipo === "curso") await db.delete(courses).where(eq(courses.id, id));

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Error al borrar:", error);
    return NextResponse.json({ ok: false, error: "No se pudo borrar" }, { status: 500 });
  }
}
