export const dynamic = "force-dynamic";
import { db } from "../../../../lib/db";
import { rounds } from "../../../../lib/db/schema";
import { eq } from "drizzle-orm";
import { v4 as uuid } from "uuid";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const datos = await request.json();

    const existentes = await db
      .select()
      .from(rounds)
      .where(eq(rounds.quizId, datos.quizId));

    await db.insert(rounds).values({
      id: uuid(),
      quizId: datos.quizId,
      name: datos.name,
      icon: datos.icon || "📚",
      description: datos.description || null,
      order: existentes.length,
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Error al crear la sección:", error);
    return NextResponse.json({ ok: false, error: "No se pudo crear" }, { status: 500 });
  }
}