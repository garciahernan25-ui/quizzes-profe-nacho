export const dynamic = "force-dynamic";
import { db } from "../../../../lib/db";
import { NextResponse } from "next/server";
import { alumnoLogueado } from "../../../../lib/estudiante";
import { siguiente } from "../../../../lib/intentos";

// Pasa a la próxima pregunta. Su tiempo empieza a contar recién ahora.
export async function POST(request: Request) {
  const studentId = await alumnoLogueado();
  if (!studentId) return NextResponse.json({ tipo: "no-encontrado" }, { status: 401 });

  try {
    const { intentoId } = await request.json();
    return NextResponse.json(await siguiente(db, studentId, String(intentoId)));
  } catch (error) {
    console.error("Error al pasar de pregunta:", error);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
