"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "../../../../components/icons";
import { colorNota } from "../../tipos";

type IntentoFicha = {
  id: string;
  numero: number;
  enCurso: boolean;
  nota: number | null;
  correctas: number;
  respondidas: number;
  puntos: number;
  empezo: number;
  duracionMs: number | null;
};

type QuizFicha = {
  quizId: string;
  titulo: string;
  nota: number | null;
  tieneIntentoDisponible: boolean;
  anterior: { nota: number; fecha: number | null } | null;
  intentos: IntentoFicha[];
};

type Ficha = {
  alumno: { id: string; fullName: string; username: string; curso: string | null; escuela: string | null; modalidad: string | null };
  quizzes: QuizFicha[];
};

function fecha(ms: number | null) {
  if (!ms) return "—";
  return new Date(ms).toLocaleString("es-AR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

function duracion(ms: number | null) {
  if (ms === null) return "—";
  const seg = Math.round(ms / 1000);
  return seg < 60 ? `${seg} s` : `${Math.floor(seg / 60)} min ${seg % 60} s`;
}

export default function FichaAlumno() {
  const params = useParams();
  const id = params.id as string;
  const [ficha, setFicha] = useState<Ficha | null>(null);
  const [error, setError] = useState("");
  const [ocupado, setOcupado] = useState("");

  function cargar() {
    fetch(`/api/alumnos/ficha?id=${encodeURIComponent(id)}`)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((data) => setFicha(data))
      .catch(() => setError("No se pudo cargar la ficha del alumno."));
  }

  useEffect(() => {
    cargar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function accion(url: string, q: QuizFicha, pregunta: string) {
    if (!ficha || !confirm(pregunta)) return;
    setOcupado(q.quizId);
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ studentId: ficha.alumno.id, quizId: q.quizId }),
    });
    setOcupado("");
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      alert(data.error || "Hubo un error. Probá de nuevo.");
    }
    cargar();
  }

  if (error) {
    return (
      <main className="page page-mid stack-lg animate-in" style={{ paddingTop: "clamp(1.5rem, 5vh, 3rem)" }}>
        <Link href="/admin/seguimiento" className="back-link"><ArrowLeft size={16} /> Volver al seguimiento</Link>
        <div className="notice notice-error">{error}</div>
      </main>
    );
  }

  if (!ficha) {
    return (
      <main className="page page-mid stack-lg animate-in" style={{ paddingTop: "clamp(1.5rem, 5vh, 3rem)" }}>
        <p className="lead">Cargando...</p>
      </main>
    );
  }

  const { alumno } = ficha;
  const curso = alumno.curso ? `${alumno.modalidad} · ${alumno.escuela} · ${alumno.curso}` : "Sin curso asignado";

  return (
    <main className="page page-mid stack-lg animate-in" style={{ paddingTop: "clamp(1.5rem, 5vh, 3rem)" }}>
      <Link href="/admin/seguimiento" className="back-link"><ArrowLeft size={16} /> Volver al seguimiento</Link>
      <header className="stack-sm">
        <h1 className="h1" style={{ wordBreak: "break-word" }}>{alumno.fullName}</h1>
        <p className="muted" style={{ wordBreak: "break-word" }}>Usuario: {alumno.username} · {curso}</p>
      </header>

      {ficha.quizzes.length === 0 ? (
        <div className="card" style={{ textAlign: "center" }}>
          <p className="lead">Todavía no hizo ningún quiz.</p>
        </div>
      ) : (
        <div className="grid-1">
          {ficha.quizzes.map((q) => {
            // La que cuenta es la mejor; si hay dos iguales, marcamos solo la primera
            const cuenta = q.anterior && q.anterior.nota === q.nota ? "anterior" : q.intentos.find((i) => i.nota !== null && i.nota === q.nota)?.id;
            return (
            <div key={q.quizId} className="card stack-sm" style={{ padding: "0.9rem 1.1rem" }}>
              <div className="row between" style={{ alignItems: "flex-start" }}>
                <div style={{ fontWeight: 650, fontSize: "1.05rem", minWidth: 0, wordBreak: "break-word" }}>{q.titulo}</div>
                <span style={{ fontWeight: 700, flexShrink: 0, color: q.nota !== null ? colorNota(q.nota) : "var(--text-muted)" }}>
                  {q.nota !== null ? `${q.nota.toFixed(1)} / 10` : "—"}
                </span>
              </div>

              <div className="stack-sm" style={{ gap: "0.35rem" }}>
                {q.anterior && (
                  <Linea titulo="Sistema anterior" detalle={`${fecha(q.anterior.fecha)} · sin puntos ni duración`} nota={q.anterior.nota} mejor={cuenta === "anterior"} />
                )}
                {q.intentos.map((i) => (
                  <Linea
                    key={i.id}
                    titulo={`Intento ${i.numero}`}
                    detalle={
                      i.enCurso
                        ? `${fecha(i.empezo)} · en curso (${i.respondidas} respondidas)`
                        : `${fecha(i.empezo)} · tardó ${duracion(i.duracionMs)} · ${i.correctas} de ${i.respondidas} bien · ${i.puntos} puntos`
                    }
                    nota={i.nota}
                    mejor={cuenta === i.id}
                  />
                ))}
              </div>

              <div className="row" style={{ gap: "0.5rem", marginTop: "0.25rem" }}>
                {q.tieneIntentoDisponible ? (
                  <span className="badge badge-success">Tiene un intento disponible</span>
                ) : (
                  <button
                    className="btn btn-ghost btn-sm"
                    disabled={ocupado === q.quizId}
                    onClick={() =>
                      accion(
                        "/api/intentos/habilitar",
                        q,
                        `¿Habilitar otro intento de "${q.titulo}" para ${alumno.fullName}?\n\nSus notas anteriores se conservan y cuenta la mejor.`
                      )
                    }
                  >
                    Habilitar otro intento
                  </button>
                )}
                <button
                  className="btn btn-danger btn-sm"
                  disabled={ocupado === q.quizId}
                  onClick={() =>
                    accion(
                      "/api/intentos/borrar",
                      q,
                      `¿Borrar TODAS las notas de "${q.titulo}" de ${alumno.fullName}?\n\nNo se puede deshacer. Después va a poder hacer el quiz de nuevo.`
                    )
                  }
                >
                  Borrar nota
                </button>
              </div>
            </div>
            );
          })}
        </div>
      )}
    </main>
  );
}

function Linea({ titulo, detalle, nota, mejor }: { titulo: string; detalle: string; nota: number | null; mejor: boolean }) {
  return (
    <div className="row between" style={{ gap: "0.5rem", borderTop: "1px solid var(--border)", paddingTop: "0.35rem" }}>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontWeight: 600 }}>
          {titulo}
          {mejor && <span className="badge badge-success" style={{ marginLeft: "0.5rem" }}>Cuenta esta</span>}
        </div>
        <div className="muted" style={{ wordBreak: "break-word" }}>{detalle}</div>
      </div>
      <b style={{ flexShrink: 0, color: nota !== null ? colorNota(nota) : "var(--text-muted)" }}>{nota !== null ? nota.toFixed(1) : "—"}</b>
    </div>
  );
}
