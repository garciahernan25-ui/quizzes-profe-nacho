export const dynamic = "force-dynamic";
import { put } from "@vercel/blob";
import { NextResponse } from "next/server";
import { esAdmin, noAutorizado } from "../../../lib/adminAuth";

export async function POST(request: Request) {
  if (!(await esAdmin())) return noAutorizado();

  try {
    const formData = await request.formData();
    const archivo = formData.get("archivo") as File;

    if (!archivo) {
      return NextResponse.json({ ok: false, error: "No llegó ninguna imagen" }, { status: 400 });
    }

    const blob = await put(archivo.name, archivo, {
      access: "public",
      addRandomSuffix: true,
    });

    return NextResponse.json({ ok: true, url: blob.url });
  } catch (error) {
    console.error("Error al subir la imagen:", error);
    return NextResponse.json({ ok: false, error: "No se pudo subir" }, { status: 500 });
  }
}