export const dynamic = "force-dynamic";
import { db } from "../../../../lib/db";
import { quizzes, courses, schools, modalities, quizCourses } from "../../../../lib/db/schema";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { esAdmin, noAutorizado } from "../../../../lib/adminAuth";
import { cambiarCursoDelQuiz } from "../../../../lib/intentos";

// Quién puede hacer un quiz: si está abierto sin cuenta (feria) y qué cursos lo tienen habilitado
export async function GET(request: Request) {
  if (!(await esAdmin())) return noAutorizado();

  try {
    const quizId = new URL(request.url).searchParams.get("quizId") ?? "";
    const quiz = (await db.select().from(quizzes).where(eq(quizzes.id, quizId)))[0];
    if (!quiz) return NextResponse.json({ ok: false, error: "No existe el quiz" }, { status: 404 });

    const cursos = await db
      .select({ id: courses.id, name: courses.name, isActive: courses.isActive, escuela: schools.name, modalidad: modalities.name })
      .from(courses)
      .innerJoin(schools, eq(courses.schoolId, schools.id))
      .innerJoin(modalities, eq(schools.modalityId, modalities.id));
    const habilitados = new Set(
      (await db.select({ courseId: quizCourses.courseId }).from(quizCourses).where(eq(quizCourses.quizId, quizId))).map((h) => h.courseId)
    );

    const orden = (a: string, b: string) => a.localeCompare(b, "es", { numeric: true });
    cursos.sort((a, b) => orden(a.modalidad, b.modalidad) || orden(a.escuela, b.escuela) || orden(a.name, b.name));

    return NextResponse.json({
      titulo: quiz.title,
      abierto: !!quiz.isPublished,
      cursos: cursos.map((c) => ({ ...c, habilitado: habilitados.has(c.id) })),
    });
  } catch (error) {
    console.error("Error al leer el acceso del quiz:", error);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}

// Cambia una sola cosa por vez: { quizId, abierto } o { quizId, courseId, habilitado }
export async function POST(request: Request) {
  if (!(await esAdmin())) return noAutorizado();

  try {
    const datos = await request.json();
    if (!datos.quizId) return NextResponse.json({ ok: false, error: "Falta el quiz" }, { status: 400 });

    if (typeof datos.abierto === "boolean") {
      await db.update(quizzes).set({ isPublished: datos.abierto, updatedAt: new Date() }).where(eq(quizzes.id, datos.quizId));
    } else if (datos.courseId && typeof datos.habilitado === "boolean") {
      await cambiarCursoDelQuiz(db, datos.quizId, datos.courseId, datos.habilitado);
    } else {
      return NextResponse.json({ ok: false, error: "Datos incompletos" }, { status: 400 });
    }
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Error al cambiar el acceso del quiz:", error);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
