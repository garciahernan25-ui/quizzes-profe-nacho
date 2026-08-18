"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";

export default function EditarPregunta() {
  const params = useParams();
  const id = params.id as string;

  const [pregunta, setPregunta] = useState("");
  const [opciones, setOpciones] = useState(["", "", "", ""]);
  const [correcta, setCorrecta] = useState(0);
  const [explicacion, setExplicacion] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    fetch("/api/preguntas/una", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.ok) {
          setPregunta(data.pregunta.question);
          setOpciones(data.pregunta.options);
          setCorrecta(data.pregunta.correctIndex);
          setExplicacion(data.pregunta.explanation);
        }
        setCargando(false);
      });
  }, []);

  function cambiarOpcion(i: number, valor: string) {
    const nuevas = [...opciones];
    nuevas[i] = valor;
    setOpciones(nuevas);
  }

  async function guardar() {
    if (!pregunta || opciones.some((o) => !o)) {
      setMensaje("Completá la pregunta y las 4 opciones.");
      return;
    }
    setGuardando(true);
    setMensaje("");
    const res = await fetch("/api/preguntas/editar", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id,
        question: pregunta,
        options: opciones,
        correctIndex: correcta,
        explanation: explicacion,
      }),
    });
    setGuardando(false);
    if (res.ok) {
      setMensaje("✓ ¡Cambios guardados!");
    } else {
      setMensaje("✗ Hubo un error al guardar.");
    }
  }

  const label = { display: "block", fontWeight: "bold", margin: "1rem 0 0.3rem" } as const;
  const input = { width: "100%", padding: "0.6rem", borderRadius: "8px", border: "1px solid #ccc", fontSize: "1rem" } as const;

  if (cargando) {
    return <main style={{ padding: "3rem", textAlign: "center" }}>Cargando...</main>;
  }

  return (
    <main style={{ padding: "3rem", maxWidth: "600px", margin: "0 auto" }}>
      <a href="/admin" style={{ color: "#2563eb", textDecoration: "none" }}>← Volver al panel</a>
      <h1 style={{ fontSize: "1.8rem", fontWeight: "bold", margin: "1rem 0" }}>Editar pregunta</h1>

      <label style={label}>Pregunta</label>
      <input value={pregunta} onChange={(e) => setPregunta(e.target.value)} style={input} />

      <label style={label}>Opciones (marcá la correcta)</label>
      {opciones.map((op, i) => (
        <div key={i} style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem" }}>
          <input
            type="radio"
            name="correcta"
            checked={correcta === i}
            onChange={() => setCorrecta(i)}
          />
          <input
            value={op}
            onChange={(e) => cambiarOpcion(i, e.target.value)}
            style={{ ...input, flex: 1 }}
          />
        </div>
      ))}

      <label style={label}>Explicación</label>
      <textarea value={explicacion} onChange={(e) => setExplicacion(e.target.value)} style={{ ...input, minHeight: "70px" }} />

      <button
        onClick={guardar}
        disabled={guardando}
        style={{
          marginTop: "1.5rem", width: "100%", padding: "0.9rem", borderRadius: "10px",
          border: "none", background: "#2563eb", color: "white", fontSize: "1.1rem",
          fontWeight: "bold", cursor: "pointer",
        }}
      >
        {guardando ? "Guardando..." : "Guardar cambios"}
      </button>

      {mensaje && (
        <p style={{ marginTop: "1rem", textAlign: "center", fontWeight: "bold" }}>{mensaje}</p>
      )}
    </main>
  );
}