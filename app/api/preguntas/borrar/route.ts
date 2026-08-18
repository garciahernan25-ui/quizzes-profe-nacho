import { db } from "../../../../lib/db";
import { questions } from "../../../../lib/db/schema";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const datos = await request.json();
    await db.delete(questions).where(eq(questions.id, datos.id));
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Error al borrar la pregunta:", error);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}