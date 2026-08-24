export const dynamic = "force-dynamic";

import { db } from "../../../../lib/db";
import { students } from "../../../../lib/db/schema";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { id } = await request.json();

    if (!id) {
      return NextResponse.json({ ok: false, error: "Falta el id del estudiante" }, { status: 400 });
    }

    await db.delete(students).where(eq(students.id, id));

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Error al borrar estudiante:", error);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}