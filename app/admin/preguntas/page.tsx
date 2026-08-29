"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft } from "../../components/icons";

type Pregunta = { id: string; roundId: string; question: string };
type Seccion = { id: string; name: string };

export default function GestionarPreguntas() {
  const [preguntas, setPreguntas] = useState<Pregunta[]>([]);
  const [secciones, setSecciones] = useState<Seccion[]>([]);

  function cargar() {
    fetch("/api/preguntas/lista")
      .then((r) => r.json())
      .then((data) => {
        setPreguntas(data.preguntas);
        setSecciones(data.secciones);
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

  function nombreSeccion(roundId: string) {
    const s = secciones.find((x) => x.id === roundId);
    return s ? s.name : "(sin sección)";
  }

  return (
    <main className="page page-mid stack-md animate-in" style={{ paddingTop: "clamp(1.5rem, 5vh, 3rem)" }}>
      <Link href="/admin" className="back-link"><ArrowLeft size={16} /> Volver al panel</Link>
      <header className="stack-sm">
        <h1 className="h1">Gestionar preguntas</h1>
        <p className="lead">Total: {preguntas.length} preguntas</p>
      </header>

      <div className="grid-1">
        {preguntas.map((p) => (
          <div key={p.id} className="card row between" style={{ padding: "1rem 1.15rem" }}>
            <div style={{ minWidth: 0, flex: "1 1 auto" }}>
              <div style={{ fontWeight: 600, wordBreak: "break-word" }}>{p.question}</div>
              <div className="muted">{nombreSeccion(p.roundId)}</div>
            </div>
            <button onClick={() => borrar(p.id)} className="btn btn-danger btn-sm">Borrar</button>
          </div>
        ))}
      </div>
    </main>
  );
}