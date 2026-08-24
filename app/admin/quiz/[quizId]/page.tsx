"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";

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
    <main style={{ padding: "2rem 1rem", maxWidth: "800px", margin: "0 auto" }}>
      <a href="/admin" style={{ color: "var(--button-bg)", textDecoration: "none" }}>
        ← Volver al panel
      </a>
      <h1 style={{ fontSize: "1.8rem", fontWeight: "bold", margin: "1rem 0" }}>
        Preguntas del quiz
      </h1>

      <a
        href={`/admin/nueva-pregunta?ronda=${quizId}`}
        style={{
          display: "inline-block",
          marginBottom: "1.5rem",
          padding: "0.7rem 1.2rem",
          borderRadius: "10px",
          background: "#16a34a",
          color: "white",
          textDecoration: "none",
          fontWeight: "bold",
        }}
      >
        + Agregar pregunta
      </a>

      {cargando ? (
        <p>Cargando...</p>
      ) : preguntas.length === 0 ? (
        <p style={{ color: "var(--text-secondary)" }}>
          Este quiz todavía no tiene preguntas.
        </p>
      ) : (
        <>
          <p style={{ color: "var(--text-secondary)", marginBottom: "1.5rem" }}>
            Total: {preguntas.length} preguntas
          </p>
          <div style={{ display: "grid", gap: "0.8rem" }}>
            {preguntas.map((p) => (
              <div
                key={p.id}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  flexWrap: "wrap",
                  gap: "1rem",
                  padding: "1rem",
                  borderRadius: "10px",
                  border: "1px solid var(--card-border)",
                  background: "var(--card-bg)",
                }}
              >
                <div style={{ minWidth: 0, flex: "1 1 auto" }}>
                  <div style={{ fontWeight: "bold", wordBreak: "break-word" }}>
                    {p.question}
                  </div>
                  <div style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>
                    {p.seccion}
                  </div>
                </div>
                <div style={{ display: "flex", gap: "0.5rem", flexShrink: 0 }}>
                  <a
                    href={`/admin/editar-pregunta/${p.id}`}
                    style={{
                      padding: "0.5rem 1rem",
                      borderRadius: "8px",
                      border: "1px solid var(--button-bg)",
                      background: "var(--card-bg)",
                      color: "var(--button-bg)",
                      textDecoration: "none",
                      whiteSpace: "nowrap",
                    }}
                  >
                    Editar
                  </a>
                  <button
                    onClick={() => borrar(p.id)}
                    style={{
                      padding: "0.5rem 1rem",
                      borderRadius: "8px",
                      border: "1px solid #ef4444",
                      background: "var(--card-bg)",
                      color: "#ef4444",
                      cursor: "pointer",
                      whiteSpace: "nowrap",
                    }}
                  >
                    Borrar
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </main>
  );
}