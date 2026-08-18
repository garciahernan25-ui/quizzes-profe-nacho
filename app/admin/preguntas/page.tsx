"use client";

import { useState, useEffect } from "react";

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
    <main style={{ padding: "3rem", maxWidth: "800px", margin: "0 auto" }}>
      <a href="/admin" style={{ color: "#2563eb", textDecoration: "none" }}>← Volver al panel</a>
      <h1 style={{ fontSize: "1.8rem", fontWeight: "bold", margin: "1rem 0" }}>Gestionar preguntas</h1>
      <p style={{ color: "#555", marginBottom: "1.5rem" }}>
        Total: {preguntas.length} preguntas
      </p>

      <div style={{ display: "grid", gap: "0.8rem" }}>
        {preguntas.map((p) => (
          <div key={p.id} style={{
            display: "flex", justifyContent: "space-between", alignItems: "center",
            gap: "1rem", padding: "1rem", borderRadius: "10px", border: "1px solid #ddd",
          }}>
            <div>
              <div style={{ fontWeight: "bold" }}>{p.question}</div>
              <div style={{ color: "#888", fontSize: "0.85rem" }}>{nombreSeccion(p.roundId)}</div>
            </div>
            <button
              onClick={() => borrar(p.id)}
              style={{
                padding: "0.5rem 1rem", borderRadius: "8px", border: "1px solid #ef4444",
                background: "white", color: "#ef4444", cursor: "pointer", whiteSpace: "nowrap",
              }}
            >
              Borrar
            </button>
          </div>
        ))}
      </div>
    </main>
  );
}