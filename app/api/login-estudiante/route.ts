import { db } from "../../../lib/db";
import { students } from "../../../lib/db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { username, password } = await request.json();

    // Buscar el estudiante por usuario
    const resultado = await db.select().from(students).where(eq(students.username, username));
    const estudiante = resultado[0];

    if (!estudiante) {
      return NextResponse.json({ ok: false, error: "Usuario o contraseña incorrectos" }, { status: 401 });
    }

    // Verificar la contraseña
    const coincide = await bcrypt.compare(password, estudiante.passwordHash);
    if (!coincide) {
      return NextResponse.json({ ok: false, error: "Usuario o contraseña incorrectos" }, { status: 401 });
    }

    // Guardar cookie con el id del estudiante (para saber quién juega)
    const cookieStore = await cookies();
    cookieStore.set("student_id", estudiante.id, {
      httpOnly: true,
      secure: false,
      maxAge: 60 * 60 * 24 * 30, // 30 días
      path: "/",
    });
    cookieStore.set("student_name", estudiante.fullName, {
      httpOnly: false,
      secure: false,
      maxAge: 60 * 60 * 24 * 30,
      path: "/",
    });

    return NextResponse.json({ ok: true, name: estudiante.fullName });
  } catch (error) {
    console.error("Error en login de estudiante:", error);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}