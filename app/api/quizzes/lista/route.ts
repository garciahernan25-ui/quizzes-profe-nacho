import { db } from "../../../../lib/db";
import { quizzes } from "../../../../lib/db/schema";
import { NextResponse } from "next/server";

export async function GET() {
  const lista = await db.select().from(quizzes);
  return NextResponse.json(lista);
}