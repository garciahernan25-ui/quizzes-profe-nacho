"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Plus } from "../../../components/icons";

type Pregunta = { id: string; question: string; seccion: string };

export default function PreguntasDelQuiz() {
  const params = useParams();
  const quizId = params.quizId as string;
  const [preguntas, setPreguntas] = useState<Pregunta[]>([]);
  const [cargando, setCargando] = useState(true);

  function cargar() {
    fetch("/api/preguntas/por-quiz", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ quizId }),
    })
      .then((r) => r.json())
      .then((data) => {
        setPreguntas(data);
        setCargando(false);
      });
  }

  useEffect(() => {
    cargar();
  }, []);

  async function borrar(id: string) {
    if (!confirm("¿Seguro que querés borrar esta pregunta?")) return;
    const res = await fetch("/api/preguntas/borrar", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    if (res.ok) {
      cargar();
    } else {
      alert("Hubo un error al borrar.");
    }
  }

  return (
    <main className="page page-mid stack-md animate-in" style={{ paddingTop: "clamp(1.5rem, 5vh, 3rem)" }}>
      <Link href="/admin" className="back-link"><ArrowLeft size={16} /> Volver al panel</Link>
      <div className="row between">
        <h1 className="h1">Preguntas del quiz</h1>
        <Link href={`/admin/nueva-pregunta?quiz=${quizId}`} className="btn btn-primary">
          <Plus size={17} /> Agregar pregunta
        </Link>
      </div>

      <QuienPuedeHacerlo quizId={quizId} />

      {cargando ? (
        <p className="lead">Cargando...</p>
      ) : preguntas.length === 0 ? (
        <div className="card" style={{ textAlign: "center" }}>
          <p className="lead">Este quiz todavía no tiene preguntas.</p>
        </div>
      ) : (
        <>
          <p className="lead">Total: {preguntas.length} preguntas</p>
          <div className="grid-1">
            {preguntas.map((p) => (
              <div key={p.id} className="card row between" style={{ padding: "1rem 1.15rem" }}>
                <div style={{ minWidth: 0, flex: "1 1 auto" }}>
                  <div style={{ fontWeight: 600, wordBreak: "break-word" }}>{p.question}</div>
                  <div className="muted">{p.seccion}</div>
                </div>
                <div className="row" style={{ gap: "0.5rem", flexShrink: 0 }}>
                  <Link href={`/admin/editar-pregunta/${p.id}`} className="btn btn-ghost btn-sm">Editar</Link>
                  <button onClick={() => borrar(p.id)} className="btn btn-danger btn-sm">Borrar</button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </main>
  );
}

type CursoAcceso = { id: string; name: string; isActive: boolean; escuela: string; modalidad: string; habilitado: boolean };

// Quién puede hacer el quiz: sin cuenta (feria) y qué cursos
function QuienPuedeHacerlo({ quizId }: { quizId: string }) {
  const [abierto, setAbierto] = useState(false);
  const [cursos, setCursos] = useState<CursoAcceso[] | null>(null);
  const [error, setError] = useState("");

  function cargar() {
    fetch(`/api/quizzes/acceso?quizId=${encodeURIComponent(quizId)}`)
      .then((r) => r.json())
      .then((data) => {
        setAbierto(data.abierto);
        setCursos(data.cursos);
      });
  }

  useEffect(() => {
    cargar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quizId]);

  async function guardar(cambio: object) {
    setError("");
    const res = await fetch("/api/quizzes/acceso", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ quizId, ...cambio }),
    });
    if (!res.ok) setError("No se pudo guardar el cambio. Probá de nuevo.");
    cargar();
  }

  if (!cursos) return null;

  return (
    <div className="card stack-sm">
      <div style={{ fontWeight: 650, fontSize: "1.05rem" }}>¿Quién puede hacer este quiz?</div>

      <label className="row" style={{ gap: "0.6rem", cursor: "pointer", flexWrap: "nowrap", alignItems: "flex-start" }}>
        <input type="checkbox" checked={abierto} onChange={(e) => guardar({ abierto: e.target.checked })} style={{ marginTop: "0.3rem" }} />
        <span>
          <b>Abierto sin cuenta (feria)</b>
          <span className="muted" style={{ display: "block" }}>
            Cualquiera lo puede jugar sin ingresar y no se guarda nada. No lo dejes abierto si lo usás para evaluar: sin cuenta se pueden ver las respuestas.
          </span>
        </span>
      </label>

      <div style={{ fontWeight: 600, marginTop: "0.5rem" }}>Cursos habilitados</div>
      {cursos.length === 0 ? (
        <p className="muted">Todavía no hay cursos. Crealos en Escuelas y cursos.</p>
      ) : (
        <div className="stack-sm" style={{ gap: "0.3rem" }}>
          {cursos.map((c) => (
            <label key={c.id} className="row" style={{ gap: "0.6rem", cursor: "pointer", flexWrap: "nowrap" }}>
              <input type="checkbox" checked={c.habilitado} onChange={(e) => guardar({ courseId: c.id, habilitado: e.target.checked })} />
              <span style={{ wordBreak: "break-word" }}>
                {c.modalidad} · {c.escuela} · {c.name}
                {!c.isActive && <span className="badge badge-muted" style={{ marginLeft: "0.5rem" }}>Oculto</span>}
              </span>
            </label>
          ))}
        </div>
      )}
      {error && <div className="notice notice-error">{error}</div>}
    </div>
  );
}
