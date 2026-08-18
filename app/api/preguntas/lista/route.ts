import { db } from "../../../../lib/db";
import { questions, rounds } from "../../../../lib/db/schema";
import { NextResponse } from "next/server";

export async function GET() {
  const preguntas = await db.select().from(questions);
  const secciones = await db.select().from(rounds);
  return NextResponse.json({ preguntas, secciones });
}