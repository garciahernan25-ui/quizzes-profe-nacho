export const dynamic = "force-dynamic";
import { db } from "../../../../lib/db";
import { questions, rounds } from "../../../../lib/db/schema";
import { NextResponse } from "next/server";
import { esAdmin, noAutorizado } from "../../../../lib/adminAuth";

export async function GET() {
  if (!(await esAdmin())) return noAutorizado();

  const preguntas = await db.select().from(questions);
  const secciones = await db.select().from(rounds);
  return NextResponse.json({ preguntas, secciones });
}