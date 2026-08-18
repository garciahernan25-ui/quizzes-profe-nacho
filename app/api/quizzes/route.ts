import { db } from "../../../lib/db";
import { quizzes, rounds } from "../../../lib/db/schema";
import { v4 as uuid } from "uuid";
import { NextResponse } from "next/server";

// Convierte "Tabla Periódica" en "tabla-periodica" para el enlace
function hacerSlug(texto: string): string {
  return texto
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export async function POST(request: Request) {
  try {
    const datos = await request.json();
    const quizId = uuid();
    const slug = hacerSlug(datos.title);

    await db.insert(quizzes).values({
      id: quizId,
      title: datos.title,
      description: datos.description || null,
      slug: slug,
      icon: datos.icon || "📝",
      subject: datos.subject || null,
      level: datos.level || null,
      isPublished: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Crear una sección inicial para que puedas cargarle preguntas enseguida
    await db.insert(rounds).values({
      id: uuid(),
      quizId: quizId,
      name: "General",
      icon: datos.icon || "📝",
      description: "Preguntas del quiz",
      order: 0,
    });

    return NextResponse.json({ ok: true, slug });
  } catch (error) {
    console.error("Error al crear el quiz:", error);
    return NextResponse.json({ ok: false, error: "No se pudo crear" }, { status: 500 });
  }
}