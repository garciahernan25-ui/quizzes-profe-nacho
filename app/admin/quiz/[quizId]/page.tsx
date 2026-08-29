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
        <Link href={`/admin/nueva-pregunta?ronda=${quizId}`} className="btn btn-primary">
          <Plus size={17} /> Agregar pregunta
        </Link>
      </div>

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