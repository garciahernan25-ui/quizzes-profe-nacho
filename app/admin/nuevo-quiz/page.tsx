"use client";

import { useState } from "react";

export default function NuevoQuiz() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [icon, setIcon] = useState("");
  const [subject, setSubject] = useState("");
  const [level, setLevel] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [guardando, setGuardando] = useState(false);

  async function guardar() {
    if (!title) {
      setMensaje("Poné al menos un título.");
      return;
    }
    setGuardando(true);
    setMensaje("");
    const res = await fetch("/api/quizzes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, description, icon, subject, level }),
    });
    setGuardando(false);
    if (res.ok) {
      setMensaje("✓ ¡Quiz creado! Ya podés cargarle preguntas.");
      setTitle("");
      setDescription("");
      setIcon("");
      setSubject("");
      setLevel("");
    } else {
      setMensaje("✗ Hubo un error al crear el quiz.");
    }
  }

  const label = { display: "block", fontWeight: "bold", margin: "1rem 0 0.3rem" } as const;
  const input = { width: "100%", padding: "0.6rem", borderRadius: "8px", border: "1px solid #ccc", fontSize: "1rem" } as const;

  return (
    <main style={{ padding: "3rem", maxWidth: "600px", margin: "0 auto" }}>
      <a href="/admin" style={{ color: "#2563eb", textDecoration: "none" }}>← Volver al panel</a>
      <h1 style={{ fontSize: "1.8rem", fontWeight: "bold", margin: "1rem 0" }}>Nuevo quiz</h1>

      <label style={label}>Título del quiz *</label>
      <input value={title} onChange={(e) => setTitle(e.target.value)} style={input} placeholder="Ej: Tabla periódica" />

      <label style={label}>Descripción</label>
      <input value={description} onChange={(e) => setDescription(e.target.value)} style={input} placeholder="De qué trata" />

      <label style={label}>Ícono (un emoji)</label>
      <input value={icon} onChange={(e) => setIcon(e.target.value)} style={input} placeholder="Ej: 🧪" />

      <label style={label}>Materia</label>
      <input value={subject} onChange={(e) => setSubject(e.target.value)} style={input} placeholder="Ej: Química" />

      <label style={label}>Nivel</label>
      <input value={level} onChange={(e) => setLevel(e.target.value)} style={input} placeholder="Ej: Secundaria" />

      <button
        onClick={guardar}
        disabled={guardando}
        style={{
          marginTop: "1.5rem", width: "100%", padding: "0.9rem", borderRadius: "10px",
          border: "none", background: "#2563eb", color: "white", fontSize: "1.1rem",
          fontWeight: "bold", cursor: "pointer",
        }}
      >
        {guardando ? "Creando..." : "Crear quiz"}
      </button>

      {mensaje && (
        <p style={{ marginTop: "1rem", textAlign: "center", fontWeight: "bold" }}>{mensaje}</p>
      )}
    </main>
  );
}