export const dynamic = "force-dynamic";
import { db } from "../../../lib/db";
import { NextResponse } from "next/server";
import { esAdmin, noAutorizado } from "../../../lib/adminAuth";
import { ranking } from "../../../lib/intentos";

// Tabla del ranking en vivo. La pantalla la pide cada 3 segundos.
export async function GET(request: Request) {
  if (!(await esAdmin())) return noAutorizado();

  try {
    const params = new URL(request.url).searchParams;
    const quizId = params.get("quizId");
    const courseId = params.get("courseId");
    if (!quizId || !courseId) return NextResponse.json({ ok: false, error: "Falta el quiz o el curso" }, { status: 400 });

    return NextResponse.json(await ranking(db, quizId, courseId), { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("Error en el ranking:", error);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
