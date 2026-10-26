export const dynamic = "force-dynamic";
import { db } from "../../../lib/db";
import { students, modalities, schools, courses } from "../../../lib/db/schema";
import { eq } from "drizzle-orm";
import { v4 as uuid } from "uuid";
import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const datos = await request.json();

    if (!datos.fullName || !datos.username || !datos.password || !datos.courseId) {
      return NextResponse.json({ ok: false, error: "Completá todos los datos." }, { status: 400 });
    }

    // El curso tiene que existir y estar visible (igual que su escuela y su modalidad)
    const elegido = (
      await db
        .select({ curso: courses, escuela: schools, modalidad: modalities })
        .from(courses)
        .innerJoin(schools, eq(courses.schoolId, schools.id))
        .innerJoin(modalities, eq(schools.modalityId, modalities.id))
        .where(eq(courses.id, datos.courseId))
    )[0];

    if (!elegido || !elegido.curso.isActive || !elegido.escuela.isActive || !elegido.modalidad.isActive) {
      return NextResponse.json({ ok: false, error: "Ese curso no está disponible. Elegilo de nuevo." }, { status: 400 });
    }

    // Chequear que el usuario no exista ya
    const existente = await db
      .select()
      .from(students)
      .where(eq(students.username, datos.username));

    if (existente.length > 0) {
      return NextResponse.json(
        { ok: false, error: "Ese usuario ya existe. Elegí otro." },
        { status: 409 }
      );
    }

    // Encriptar la contraseña
    const passwordHash = await bcrypt.hash(datos.password, 10);

    await db.insert(students).values({
      id: uuid(),
      fullName: datos.fullName,
      username: datos.username,
      passwordHash: passwordHash,
      // Se guardan también los nombres como texto, igual que en los registros viejos
      modality: elegido.modalidad.name,
      school: elegido.escuela.name,
      courseId: elegido.curso.id,
      createdAt: new Date(),
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Error en el registro:", error);
    return NextResponse.json({ ok: false, error: "No se pudo registrar" }, { status: 500 });
  }
}
