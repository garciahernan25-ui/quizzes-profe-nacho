"use client";

import { useState, useEffect, useRef } from "react";
import { useParams } from "next/navigation";

export default function EditarPregunta() {
  const params = useParams();
  const id = params.id as string;

  const [pregunta, setPregunta] = useState("");
  const [questionImage, setQuestionImage] = useState<string | null>(null);
  const [opciones, setOpciones] = useState(["", "", "", ""]);
  const [optionImages, setOptionImages] = useState<(string | null)[]>([null, null, null, null]);
  const [correcta, setCorrecta] = useState(0);
  const [explicacion, setExplicacion] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [subiendo, setSubiendo] = useState(false);
  const [subiendoOp, setSubiendoOp] = useState<number | null>(null);

  // Refs para inputs ocultos de archivo
  const inputPreguntaRef = useRef<HTMLInputElement>(null);
  const inputOpcionRefs = useRef<(HTMLInputElement | null)[]>([null, null, null, null]);

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
          setQuestionImage(data.pregunta.questionImage || null);
          setOpciones(data.pregunta.options);
          setOptionImages(data.pregunta.optionImages || [null, null, null, null]);
          setCorrecta(data.pregunta.correctIndex);
          setExplicacion(data.pregunta.explicacion);
        }
        setCargando(false);
      });
  }, []);

  function cambiarOpcion(i: number, valor: string) {
    const nuevas = [...opciones];
    nuevas[i] = valor;
    setOpciones(nuevas);
  }

  async function subirArchivo(archivo: File): Promise<string | null> {
    const formData = new FormData();
    formData.append("archivo", archivo);
    const res = await fetch("/api/subir-imagen", { method: "POST", body: formData });
    const data = await res.json();
    return data.ok ? data.url : null;
  }

  async function subirImagenPregunta(e: React.ChangeEvent<HTMLInputElement>) {
    const archivo = e.target.files?.[0];
    if (!archivo) return;
    setSubiendo(true);
    setMensaje("");
    const url = await subirArchivo(archivo);
    setSubiendo(false);
    if (url) setQuestionImage(url);
    else setMensaje("✗ No se pudo subir la imagen.");
  }

  async function subirImagenOpcion(i: number, e: React.ChangeEvent<HTMLInputElement>) {
    const archivo = e.target.files?.[0];
    if (!archivo) return;
    setSubiendoOp(i);
    setMensaje("");
    const url = await subirArchivo(archivo);
    setSubiendoOp(null);
    if (url) {
      const nuevas = [...optionImages];
      nuevas[i] = url;
      setOptionImages(nuevas);
    } else {
      setMensaje("✗ No se pudo subir la imagen.");
    }
  }

  function quitarImagenPregunta() {
    setQuestionImage(null);
  }

  function quitarImagenOpcion(i: number) {
    const nuevas = [...optionImages];
    nuevas[i] = null;
    setOptionImages(nuevas);
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
        questionImage: questionImage || null,
        options: opciones,
        optionImages: optionImages.some((img) => img) ? optionImages : null,
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
  const botonImagen = {
    display: "inline-block",
    padding: "0.5rem 1rem",
    borderRadius: "8px",
    border: "1px solid var(--button-bg)",
    background: "var(--card-bg)",
    color: "var(--button-bg)",
    cursor: "pointer",
    fontSize: "0.9rem",
    fontWeight: "bold",
    marginTop: "0.3rem",
  } as const;

  if (cargando) {
    return <main style={{ padding: "2rem", textAlign: "center" }}>Cargando...</main>;
  }

  return (
    <main style={{ padding: "2rem 1rem", maxWidth: "600px", margin: "0 auto" }}>
      <a href="/admin" style={{ color: "var(--button-bg)", textDecoration: "none" }}>← Volver al panel</a>
      <h1 style={{ fontSize: "1.8rem", fontWeight: "bold", margin: "1rem 0" }}>Editar pregunta</h1>

      <label style={label}>Pregunta</label>
      <input value={pregunta} onChange={(e) => setPregunta(e.target.value)} style={input} />

      {/* Imagen de la pregunta */}
      <label style={label}>Imagen de la pregunta</label>
      <input
        ref={inputPreguntaRef}
        type="file"
        accept="image/*"
        style={{ display: "none" }}
        onChange={subirImagenPregunta}
      />
      <button
        type="button"
        style={botonImagen}
        onClick={() => inputPreguntaRef.current?.click()}
        disabled={subiendo}
      >
        {subiendo ? "Subiendo..." : "📷 Subir imagen"}
      </button>
      {questionImage && (
        <div style={{ marginTop: "0.5rem" }}>
          <img src={questionImage} alt="" style={{ maxWidth: "100%", borderRadius: "8px", border: "1px solid var(--card-border)" }} />
          <button
            onClick={quitarImagenPregunta}
            style={{
              display: "block",
              marginTop: "0.3rem",
              padding: "0.3rem 0.7rem",
              borderRadius: "6px",
              border: "1px solid #ef4444",
              background: "var(--card-bg)",
              color: "#ef4444",
              cursor: "pointer",
              fontSize: "0.85rem",
            }}
          >
            Quitar imagen
          </button>
        </div>
      )}

      <label style={label}>Opciones (marcá la correcta)</label>
      {opciones.map((op, i) => (
        <div key={i} style={{ marginBottom: "0.8rem", border: "1px solid var(--card-border)", borderRadius: "10px", padding: "0.8rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
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

          {/* Imagen de la opción */}
          <div style={{ marginTop: "0.5rem", paddingLeft: "1.5rem" }}>
            <input
              ref={(el) => {
                inputOpcionRefs.current[i] = el;
              }}
              type="file"
              accept="image/*"
              style={{ display: "none" }}
              onChange={(e) => subirImagenOpcion(i, e)}
            />
            <button
              type="button"
              style={botonImagen}
              onClick={() => inputOpcionRefs.current[i]?.click()}
              disabled={subiendoOp === i}
            >
              {subiendoOp === i ? "Subiendo..." : "📷 Subir imagen"}
            </button>
            {optionImages[i] && (
              <div style={{ marginTop: "0.4rem" }}>
                <img src={optionImages[i]} alt="" style={{ maxWidth: "120px", borderRadius: "6px", border: "1px solid var(--card-border)" }} />
                <button
                  onClick={() => quitarImagenOpcion(i)}
                  style={{
                    display: "block",
                    marginTop: "0.3rem",
                    padding: "0.2rem 0.6rem",
                    borderRadius: "6px",
                    border: "1px solid #ef4444",
                    background: "var(--card-bg)",
                    color: "#ef4444",
                    cursor: "pointer",
                    fontSize: "0.8rem",
                  }}
                >
                  Quitar
                </button>
              </div>
            )}
          </div>
        </div>
      ))}

      <label style={label}>Explicación</label>
      <textarea value={explicacion} onChange={(e) => setExplicacion(e.target.value)} style={{ ...input, minHeight: "70px" }} />

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
        {guardando ? "Guardando..." : "Guardar cambios"}
      </button>

      {mensaje && (
        <p style={{ marginTop: "1rem", textAlign: "center", fontWeight: "bold" }}>{mensaje}</p>
      )}
    </main>
  );
}