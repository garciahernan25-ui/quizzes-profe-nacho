export const dynamic = "force-dynamic";
import { db } from "../../../lib/db";
import { rounds } from "../../../lib/db/schema";
import { NextResponse } from "next/server";
import { esAdmin, noAutorizado } from "../../../lib/adminAuth";

export async function GET() {
  if (!(await esAdmin())) return noAutorizado();

  const lista = await db.select().from(rounds);
  return NextResponse.json(lista);
}