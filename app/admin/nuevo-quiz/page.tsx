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
  const [rondaCreada, setRondaCreada] = useState("");

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
    const data = await res.json();
    setGuardando(false);
    if (res.ok && data.ok) {
      setMensaje("✓ ¡Quiz creado!");
      setRondaCreada(data.rondaId);
    } else {
      setMensaje("✗ Hubo un error al crear el quiz.");
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

  // Si el quiz ya se creó, mostramos la pantalla de "listo, cargá preguntas"
  if (rondaCreada) {
    return (
      <main style={{ padding: "2rem 1rem", maxWidth: "600px", margin: "0 auto", textAlign: "center" }}>
        <h1 style={{ fontSize: "1.8rem", fontWeight: "bold", margin: "1rem 0" }}>✓ ¡Quiz creado!</h1>
        <p style={{ color: "var(--text-secondary)", marginBottom: "2rem" }}>Ahora podés cargarle preguntas.</p>
        <a
          href={`/admin/nueva-pregunta?ronda=${rondaCreada}`}
          style={{
            display: "inline-block",
            padding: "0.9rem 1.5rem",
            borderRadius: "10px",
            background: "#16a34a",
            color: "white",
            textDecoration: "none",
            fontWeight: "bold",
            fontSize: "1.1rem",
            marginBottom: "1rem",
          }}
        >
          + Agregar preguntas a este quiz
        </a>
        <br />
        <a href="/admin" style={{ color: "var(--button-bg)", textDecoration: "none" }}>← Volver al panel</a>
      </main>
    );
  }

  return (
    <main style={{ padding: "2rem 1rem", maxWidth: "600px", margin: "0 auto" }}>
      <a href="/admin" style={{ color: "var(--button-bg)", textDecoration: "none" }}>← Volver al panel</a>
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
        {guardando ? "Creando..." : "Crear quiz"}
      </button>

      {mensaje && (
        <p style={{ marginTop: "1rem", textAlign: "center", fontWeight: "bold" }}>{mensaje}</p>
      )}
    </main>
  );
}