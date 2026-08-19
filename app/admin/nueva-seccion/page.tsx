"use client";

import { useState, useEffect } from "react";

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

  const label = { display: "block", fontWeight: "bold", margin: "1rem 0 0.3rem" } as const;
  const input = {
    width: "100%",
    padding: "0.6rem",
    borderRadius: "8px",
    border: "1px solid var(--card-border)",
    background: "var(--card-bg)",
    color: "var(--foreground)",
    fontSize: "1rem",
    boxSizing: "border-box",
  } as const;

  return (
    <main style={{ padding: "2rem 1rem", maxWidth: "600px", margin: "0 auto" }}>
      <a href="/admin" style={{ color: "var(--button-bg)", textDecoration: "none" }}>← Volver al panel</a>
      <h1 style={{ fontSize: "1.8rem", fontWeight: "bold", margin: "1rem 0" }}>Nueva sección</h1>
      <p style={{ color: "var(--text-secondary)" }}>
        Una sección es una parte dentro de un quiz (por ejemplo un nivel o un subtema).
      </p>

      <label style={label}>¿A qué quiz pertenece?</label>
      <select value={quizId} onChange={(e) => setQuizId(e.target.value)} style={input}>
        {quizzes.map((q) => (
          <option key={q.id} value={q.id}>{q.title}</option>
        ))}
      </select>

      <label style={label}>Nombre de la sección *</label>
      <input value={name} onChange={(e) => setName(e.target.value)} style={input} placeholder="Ej: Nivel fácil" />

      <label style={label}>Ícono (un emoji)</label>
      <input value={icon} onChange={(e) => setIcon(e.target.value)} style={input} placeholder="Ej: 📗" />

      <label style={label}>Descripción</label>
      <input value={description} onChange={(e) => setDescription(e.target.value)} style={input} placeholder="De qué trata esta sección" />

      <button
        onClick={guardar}
        disabled={guardando}
        style={{
          marginTop: "1.5rem",
          width: "100%",
          padding: "0.9rem",
          borderRadius: "10px",
          border: "none",
          background: "var(--button-bg)",
          color: "var(--button-text)",
          fontSize: "1.1rem",
          fontWeight: "bold",
          cursor: "pointer",
        }}
      >
        {guardando ? "Creando..." : "Crear sección"}
      </button>

      {mensaje && (
        <p style={{ marginTop: "1rem", textAlign: "center", fontWeight: "bold" }}>{mensaje}</p>
      )}
    </main>
  );
}