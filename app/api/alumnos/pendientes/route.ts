export const dynamic = "force-dynamic";
import { db } from "../../../../lib/db";
import { NextResponse } from "next/server";
import { esAdmin, noAutorizado } from "../../../../lib/adminAuth";
import { pendientes } from "../../../../lib/alumnos";

// Alumnos que se registraron y esperan aprobación
export async function GET() {
  if (!(await esAdmin())) return noAutorizado();

  try {
    const lista = await pendientes(db);
    return NextResponse.json(
      lista.map((p) => ({ ...p, createdAt: p.createdAt ? p.createdAt.getTime() : null })),
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (error) {
    console.error("Error al listar pendientes:", error);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
