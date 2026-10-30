"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

// Cada cuántos milisegundos pregunta si el profe ya lo aprobó
const CADA_MS = 5000;

// Pantalla del alumno recién registrado. Cuando el profe lo aprueba (o lo rechaza),
// la página se actualiza sola, sin tener que volver a loguearse.
export default function EsperandoAprobacion() {
  const router = useRouter();

  useEffect(() => {
    let cancelado = false;
    async function preguntar() {
      if (document.hidden) return;
      try {
        const res = await fetch("/api/estado-alumno", { cache: "no-store" });
        if (!res.ok) return;
        const { status } = await res.json();
        if (!cancelado && status !== "pendiente") router.refresh();
      } catch {
        // Sin internet: vuelve a probar en el próximo turno
      }
    }
    const t = setInterval(preguntar, CADA_MS);
    return () => {
      cancelado = true;
      clearInterval(t);
    };
  }, [router]);

  return (
    <div className="card card-pad-lg stack-md" style={{ textAlign: "center" }}>
      <div style={{ fontSize: "2.5rem" }} aria-hidden>⏳</div>
      <h2 className="h2">Tu usuario está esperando que el profe lo apruebe</h2>
      <p className="lead">No hace falta que hagas nada: apenas te apruebe, acá van a aparecer tus quizzes.</p>
    </div>
  );
}
