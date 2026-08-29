"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, Notice } from "../../components/icons";

type Quiz = { id: string; title: string };

export default function NuevaSeccion() {
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [quizId, setQuizId] = useState("");
  const [name, setName] = useState("");
  const [icon, setIcon] = useState("");
  const [description, setDescription] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    fetch("/api/quizzes/lista")
      .then((r) => r.json())
      .then((data) => {
        setQuizzes(data);
        if (data.length > 0) setQuizId(data[0].id);
      });
  }, []);

  async function guardar() {
    if (!quizId || !name) {
      setMensaje("Elegí un quiz y poné un nombre para la sección.");
      return;
    }
    setGuardando(true);
    setMensaje("");
    const res = await fetch("/api/rondas/crear", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ quizId, name, icon, description }),
    });
    setGuardando(false);
    if (res.ok) {
      setMensaje("✓ ¡Sección creada! Ya podés cargarle preguntas.");
      setName("");
      setIcon("");
      setDescription("");
    } else {
      setMensaje("✗ Hubo un error al crear la sección.");
    }
  }

  const exito = mensaje.startsWith("✓");

  return (
    <main className="page page-narrow animate-in" style={{ paddingTop: "clamp(1.5rem, 5vh, 3rem)" }}>
      <Link href="/admin" className="back-link" style={{ marginBottom: "1.5rem" }}><ArrowLeft size={16} /> Volver al panel</Link>

      <div className="card card-pad-lg stack-md">
        <header className="stack-sm">
          <h1 className="h1">Nueva sección</h1>
          <p className="lead">Una sección es una parte dentro de un quiz (un nivel o un subtema).</p>
        </header>

        <div>
          <div className="field">
            <label className="label">¿A qué quiz pertenece?</label>
            <select className="select" value={quizId} onChange={(e) => setQuizId(e.target.value)}>
              {quizzes.map((q) => (
                <option key={q.id} value={q.id}>{q.title}</option>
              ))}
            </select>
          </div>
          <div className="field">
            <label className="label">Nombre de la sección *</label>
            <input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ej: Nivel fácil" />
          </div>
          <div className="field">
            <label className="label">Ícono (un emoji)</label>
            <input className="input" value={icon} onChange={(e) => setIcon(e.target.value)} placeholder="Ej: 📗" />
          </div>
          <div className="field">
            <label className="label">Descripción</label>
            <input className="input" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="De qué trata esta sección" />
          </div>
        </div>

        <button onClick={guardar} disabled={guardando} className="btn btn-primary btn-lg btn-block">
          {guardando ? "Creando..." : "Crear sección"}
        </button>

        {mensaje && <Notice message={mensaje} success={exito} />}
      </div>
    </main>
  );
}