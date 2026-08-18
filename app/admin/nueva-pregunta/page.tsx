"use client";

import { useState, useEffect } from "react";

type Ronda = { id: string; name: string };

export default function NuevaPregunta() {
  const [rondas, setRondas] = useState<Ronda[]>([]);
  const [roundId, setRoundId] = useState("");
  const [pregunta, setPregunta] = useState("");
  const [opciones, setOpciones] = useState(["", "", "", ""]);
  const [opcionesImg, setOpcionesImg] = useState<string[]>(["", "", "", ""]);
  const [correcta, setCorrecta] = useState(0);
  const [explicacion, setExplicacion] = useState("");
  const [imagenUrl, setImagenUrl] = useState("");
  const [subiendo, setSubiendo] = useState(false);
  const [subiendoOp, setSubiendoOp] = useState<number | null>(null);
  const [mensaje, setMensaje] = useState("");
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    fetch("/api/rondas")
      .then((r) => r.json())
      .then((data) => {
        setRondas(data);
        if (data.length > 0) setRoundId(data[0].id);
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
    if (url) setImagenUrl(url);
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
      const nuevas = [...opcionesImg];
      nuevas[i] = url;
      setOpcionesImg(nuevas);
    } else {
      setMensaje("✗ No se pudo subir la imagen.");
    }
  }

  function quitarImagenOpcion(i: number) {
    const nuevas = [...opcionesImg];
    nuevas[i] = "";
    setOpcionesImg(nuevas);
  }

  async function guardar() {
    if (!roundId || !pregunta) {
      setMensaje("Completá la ronda y la pregunta.");
      return;
    }
    // Cada opción debe tener texto O imagen
    for (let i = 0; i < 4; i++) {
      if (!opciones[i] && !opcionesImg[i]) {
        setMensaje(`La opción ${i + 1} necesita texto o una imagen.`);
        return;
      }
    }
    setGuardando(true);
    setMensaje("");
    const hayImagenes = opcionesImg.some((x) => x);
    const res = await fetch("/api/preguntas", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        roundId,
        question: pregunta,
        questionImage: imagenUrl || null,
        options: opciones,
        optionImages: hayImagenes ? opcionesImg : null,
        correctIndex: correcta,
        explanation: explicacion,
      }),
    });
    setGuardando(false);
    if (res.ok) {
      setMensaje("✓ ¡Pregunta guardada!");
      setPregunta("");
      setOpciones(["", "", "", ""]);
      setOpcionesImg(["", "", "", ""]);
      setCorrecta(0);
      setExplicacion("");
      setImagenUrl("");
    } else {
      setMensaje("✗ Hubo un error al guardar.");
    }
  }

  const label = { display: "block", fontWeight: "bold", margin: "1rem 0 0.3rem" } as const;
  const input = { width: "100%", padding: "0.6rem", borderRadius: "8px", border: "1px solid #ccc", fontSize: "1rem" } as const;

  return (
    <main style={{ padding: "3rem", maxWidth: "600px", margin: "0 auto" }}>
      <a href="/admin" style={{ color: "#2563eb", textDecoration: "none" }}>← Volver al panel</a>
      <h1 style={{ fontSize: "1.8rem", fontWeight: "bold", margin: "1rem 0" }}>Nueva pregunta</h1>

      <label style={label}>Ronda</label>
      <select value={roundId} onChange={(e) => setRoundId(e.target.value)} style={input}>
        {rondas.map((r) => (
          <option key={r.id} value={r.id}>{r.name}</option>
        ))}
      </select>

      <label style={label}>Pregunta</label>
      <input value={pregunta} onChange={(e) => setPregunta(e.target.value)} style={input} placeholder="Escribí la pregunta" />

      <label style={label}>Imagen de la pregunta (opcional)</label>
      <input type="file" accept="image/*" onChange={subirImagenPregunta} />
      {subiendo && <p style={{ color: "#888", marginTop: "0.5rem" }}>Subiendo imagen...</p>}
      {imagenUrl && (
        <div style={{ marginTop: "0.8rem" }}>
          <img src={imagenUrl} alt="" style={{ maxWidth: "100%", borderRadius: "8px", border: "1px solid #ddd" }} />
          <button onClick={() => setImagenUrl("")} style={{ display: "block", marginTop: "0.5rem", padding: "0.3rem 0.7rem", borderRadius: "6px", border: "1px solid #ef4444", background: "white", color: "#ef4444", cursor: "pointer", fontSize: "0.85rem" }}>
            Quitar imagen
          </button>
        </div>
      )}

      <label style={label}>Opciones (marcá la correcta) — cada una puede ser texto y/o imagen</label>
      {opciones.map((op, i) => (
        <div key={i} style={{ border: "1px solid #eee", borderRadius: "10px", padding: "0.8rem", marginBottom: "0.8rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <input type="radio" name="correcta" checked={correcta === i} onChange={() => setCorrecta(i)} />
            <input value={op} onChange={(e) => cambiarOpcion(i, e.target.value)} style={{ ...input, flex: 1 }} placeholder={`Opción ${i + 1} (texto)`} />
          </div>
          <div style={{ marginTop: "0.5rem", paddingLeft: "1.5rem" }}>
            <input type="file" accept="image/*" onChange={(e) => subirImagenOpcion(i, e)} />
            {subiendoOp === i && <span style={{ color: "#888", fontSize: "0.85rem" }}> subiendo...</span>}
            {opcionesImg[i] && (
              <div style={{ marginTop: "0.4rem" }}>
                <img src={opcionesImg[i]} alt="" style={{ maxWidth: "120px", borderRadius: "6px", border: "1px solid #ddd" }} />
                <button onClick={() => quitarImagenOpcion(i)} style={{ display: "block", marginTop: "0.3rem", padding: "0.2rem 0.6rem", borderRadius: "6px", border: "1px solid #ef4444", background: "white", color: "#ef4444", cursor: "pointer", fontSize: "0.8rem" }}>
                  Quitar
                </button>
              </div>
            )}
          </div>
        </div>
      ))}

      <label style={label}>Explicación (opcional)</label>
      <textarea value={explicacion} onChange={(e) => setExplicacion(e.target.value)} style={{ ...input, minHeight: "70px" }} placeholder="Por qué es correcta" />

      <button onClick={guardar} disabled={guardando} style={{ marginTop: "1.5rem", width: "100%", padding: "0.9rem", borderRadius: "10px", border: "none", background: "#2563eb", color: "white", fontSize: "1.1rem", fontWeight: "bold", cursor: "pointer" }}>
        {guardando ? "Guardando..." : "Guardar pregunta"}
      </button>

      {mensaje && <p style={{ marginTop: "1rem", textAlign: "center", fontWeight: "bold" }}>{mensaje}</p>}
    </main>
  );
}