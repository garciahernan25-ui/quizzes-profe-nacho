"use client";

import { useState, useEffect, useRef } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Camera, Notice } from "../../../components/icons";

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

  const exito = mensaje.startsWith("✓");

  if (cargando) {
    return <main className="page" style={{ textAlign: "center" }}>Cargando...</main>;
  }

  return (
    <main className="page page-narrow animate-in" style={{ paddingTop: "clamp(1.5rem, 5vh, 3rem)" }}>
      <Link href="/admin" className="back-link" style={{ marginBottom: "1.5rem" }}><ArrowLeft size={16} /> Volver al panel</Link>

      <div className="card card-pad-lg stack-md">
        <h1 className="h1">Editar pregunta</h1>

        <div className="field">
          <label className="label">Pregunta</label>
          <input className="input" value={pregunta} onChange={(e) => setPregunta(e.target.value)} />
        </div>

        {/* Imagen de la pregunta */}
        <div className="field">
          <label className="label">Imagen de la pregunta</label>
          <input ref={inputPreguntaRef} type="file" accept="image/*" style={{ display: "none" }} onChange={subirImagenPregunta} />
          <button type="button" className="btn btn-ghost btn-sm" style={{ alignSelf: "flex-start" }} onClick={() => inputPreguntaRef.current?.click()} disabled={subiendo}>
            {subiendo ? "Subiendo..." : <><Camera size={15} /> Subir imagen</>}
          </button>
          {questionImage && (
            <div className="stack-sm" style={{ marginTop: "0.5rem" }}>
              <img src={questionImage} alt="" style={{ borderRadius: "var(--r-md)", border: "1px solid var(--border)" }} />
              <button onClick={quitarImagenPregunta} className="btn btn-danger btn-sm" style={{ alignSelf: "flex-start" }}>Quitar imagen</button>
            </div>
          )}
        </div>

        <div className="stack-sm">
          <label className="label">Opciones (marcá la correcta)</label>
          {opciones.map((op, i) => (
            <div key={i} className="card" style={{ background: "var(--bg-subtle)", padding: "0.9rem" }}>
              <div className="row" style={{ gap: "0.6rem", flexWrap: "nowrap" }}>
                <input type="radio" name="correcta" checked={correcta === i} onChange={() => setCorrecta(i)} style={{ accentColor: "var(--brand)", width: 18, height: 18 }} />
                <input className="input" value={op} onChange={(e) => cambiarOpcion(i, e.target.value)} />
              </div>

              <div style={{ marginTop: "0.6rem", paddingLeft: "1.8rem" }}>
                <input
                  ref={(el) => { inputOpcionRefs.current[i] = el; }}
                  type="file"
                  accept="image/*"
                  style={{ display: "none" }}
                  onChange={(e) => subirImagenOpcion(i, e)}
                />
                <button type="button" className="btn btn-ghost btn-sm" onClick={() => inputOpcionRefs.current[i]?.click()} disabled={subiendoOp === i}>
                  {subiendoOp === i ? "Subiendo..." : <><Camera size={15} /> Subir imagen</>}
                </button>
                {optionImages[i] && (
                  <div className="stack-sm" style={{ marginTop: "0.4rem" }}>
                    <img src={optionImages[i]!} alt="" style={{ maxWidth: "120px", borderRadius: "var(--r-sm)", border: "1px solid var(--border)" }} />
                    <button onClick={() => quitarImagenOpcion(i)} className="btn btn-danger btn-sm" style={{ alignSelf: "flex-start" }}>Quitar</button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="field" style={{ marginBottom: 0 }}>
          <label className="label">Explicación</label>
          <textarea className="textarea" value={explicacion} onChange={(e) => setExplicacion(e.target.value)} />
        </div>

        <button onClick={guardar} disabled={guardando} className="btn btn-primary btn-lg btn-block">
          {guardando ? "Guardando..." : "Guardar cambios"}
        </button>

        {mensaje && <Notice message={mensaje} success={exito} />}
      </div>
    </main>
  );
}