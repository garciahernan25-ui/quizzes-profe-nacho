import { db } from "../../../lib/db";
import { students } from "../../../lib/db/schema";
import { eq } from "drizzle-orm";
import { v4 as uuid } from "uuid";
import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const datos = await request.json();

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
      modality: datos.modality,
      school: datos.school,
      year: datos.year || null,
      division: datos.division || null,
      extraInfo: datos.extraInfo || null,
      createdAt: new Date(),
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Error en el registro:", error);
    return NextResponse.json({ ok: false, error: "No se pudo registrar" }, { status: 500 });
  }
}