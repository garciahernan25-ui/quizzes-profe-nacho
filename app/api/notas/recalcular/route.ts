export const dynamic = "force-dynamic";
import { db } from "../../../../lib/db";
import { NextResponse } from "next/server";
import { esAdmin, noAutorizado } from "../../../../lib/adminAuth";
import { aplicarRecalculo, vistaPreviaRecalculo } from "../../../../lib/notasEditadas";

// GET: qué notas cambiarían con las respuestas correctas de hoy (no toca nada)
export async function GET(request: Request) {
  if (!(await esAdmin())) return noAutorizado();

  try {
    const quizId = new URL(request.url).searchParams.get("quizId");
    if (!quizId) return NextResponse.json({ ok: false, error: "Falta el quiz" }, { status: 400 });
    return NextResponse.json(await vistaPreviaRecalculo(db, quizId), { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("Error en la vista previa del recálculo:", error);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}

// POST: aplica el recálculo (las notas editadas a mano y las del sistema anterior no se tocan)
export async function POST(request: Request) {
  if (!(await esAdmin())) return noAutorizado();

  try {
    const { quizId } = await request.json();
    if (!quizId) return NextResponse.json({ ok: false, error: "Falta el quiz" }, { status: 400 });
    return NextResponse.json({ ok: true, ...(await aplicarRecalculo(db, String(quizId))) });
  } catch (error) {
    console.error("Error al recalcular:", error);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
