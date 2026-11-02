export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { db } from "../../../../lib/db";
import { notasParaAgenda, tokenAgendaValido } from "../../../../lib/agenda";
import type { DB } from "../../../../lib/intentos";

// Solo lectura, para la Agenda docente. Se entra con el token compartido (AGENDA_TOKEN), no con la cookie de admin.
export async function GET(request: Request) {
  if (!tokenAgendaValido(request.headers.get("authorization"))) {
    return NextResponse.json({ ok: false, error: "No autorizado" }, { status: 401 });
  }
  try {
    return NextResponse.json({ ok: true, ...(await notasParaAgenda(db as unknown as DB)) }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("Error en notas para la agenda:", error);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
