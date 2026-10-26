export const dynamic = "force-dynamic";

import { db } from "../../../../lib/db";
import { students, courses } from "../../../../lib/db/schema";
import { eq, inArray } from "drizzle-orm";
import { NextResponse } from "next/server";
import { esAdmin, noAutorizado } from "../../../../lib/adminAuth";

// Asigna uno o varios alumnos a un curso (o les saca el curso si courseId es null).
// Solo cambia el curso del alumno: sus notas no se tocan.
export async function POST(request: Request) {
  if (!(await esAdmin())) return noAutorizado();

  try {
    const { ids, courseId } = await request.json();

    if (!Array.isArray(ids) || ids.length === 0 || !ids.every((id) => typeof id === "string")) {
      return NextResponse.json({ ok: false, error: "Elegí al menos un alumno" }, { status: 400 });
    }

    if (courseId !== null) {
      const curso = await db.select().from(courses).where(eq(courses.id, courseId ?? ""));
      if (curso.length === 0) {
        return NextResponse.json({ ok: false, error: "Ese curso no existe" }, { status: 400 });
      }
    }

    const resultado = await db.update(students).set({ courseId }).where(inArray(students.id, ids));

    return NextResponse.json({ ok: true, cambiados: resultado.rowsAffected });
  } catch (error) {
    console.error("Error al asignar curso:", error);
    return NextResponse.json({ ok: false, error: "No se pudo asignar" }, { status: 500 });
  }
}
