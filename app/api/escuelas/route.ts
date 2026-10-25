export const dynamic = "force-dynamic";
import { db } from "../../../lib/db";
import { modalities, schools, courses, students } from "../../../lib/db/schema";
import { NextResponse } from "next/server";
import { esAdmin, noAutorizado } from "../../../lib/adminAuth";

// Lista completa para el panel (incluye lo oculto y cuántos alumnos tiene cada curso)
export async function GET() {
  if (!(await esAdmin())) return noAutorizado();

  try {
    const listaModalidades = await db.select().from(modalities);
    const listaEscuelas = await db.select().from(schools);
    const listaCursos = await db.select().from(courses);
    const alumnos = await db.select({ courseId: students.courseId }).from(students);

    const cursosConAlumnos = listaCursos.map((c) => ({
      ...c,
      cantAlumnos: alumnos.filter((a) => a.courseId === c.id).length,
    }));

    const porNombre = (a: { name: string }, b: { name: string }) => a.name.localeCompare(b.name, "es", { numeric: true });

    return NextResponse.json({
      modalidades: listaModalidades.sort(porNombre),
      escuelas: listaEscuelas.sort(porNombre),
      cursos: cursosConAlumnos.sort(porNombre),
    });
  } catch (error) {
    console.error("Error al listar escuelas:", error);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
