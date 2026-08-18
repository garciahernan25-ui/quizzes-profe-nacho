import { db } from "../../../lib/db";
import { rounds } from "../../../lib/db/schema";
import { NextResponse } from "next/server";

export async function GET() {
  const lista = await db.select().from(rounds);
  return NextResponse.json(lista);
}