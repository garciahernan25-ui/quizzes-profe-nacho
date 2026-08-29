"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Notice } from "../../components/icons";

type Ronda = { id: string; name: string; quizId?: string };

function FormularioNuevaPregunta() {
  const searchParams = useSearchParams();
  const rondaFija = searchParams.get("ronda");
  const quizId = searchParams.get("quiz");

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
    // Caso 1: llega una ronda concreta (?ronda=<id>), la usamos fija.
    if (rondaFija) {
      setRoundId(rondaFija);
      return;
    }
    // Caso 2 y 3: cargamos las rondas. Si llega ?quiz=<id>, mostramos
    // solo las rondas de ese quiz; si no, todas. Siempre por el selector,
    // así nunca guardamos un id que no sea una ronda válida.
    fetch("/api/rondas")
      .then((r) => r.json())
      .then((data: Ronda[]) => {
        const lista = quizId ? data.filter((r) => r.quizId === quizId) : data;
        setRondas(lista);
        if (lista.length > 0) setRoundId(lista[0].id);
      });
  }, [rondaFija, quizId]);

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
    if (!roundId) {
      setMensaje("Este quiz no tiene secciones. Creá una sección antes de agregar preguntas.");
      return;
    }
    if (!pregunta) {
      setMensaje("Completá la pregunta.");
      return;
    }
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
      setMensaje("✓ ¡Pregunta guardada! Podés cargar otra.");
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

  const exito = mensaje.startsWith("✓");

  return (
    <main className="page page-narrow animate-in" style={{ paddingTop: "clamp(1.5rem, 5vh, 3rem)" }}>
      <Link href="/admin" className="back-link" style={{ marginBottom: "1.5rem" }}><ArrowLeft size={16} /> Volver al panel</Link>

      <div className="card card-pad-lg stack-md">
        <h1 className="h1">Nueva pregunta</h1>

        <div>
          {!rondaFija && (
            <div className="field">
              <label className="label">Ronda</label>
              <select className="select" value={roundId} onChange={(e) => setRoundId(e.target.value)}>
                {rondas.map((r) => (
                  <option key={r.id} value={r.id}>{r.name}</option>
                ))}
              </select>
            </div>
          )}

          <div className="field">
            <label className="label">Pregunta</label>
            <input className="input" value={pregunta} onChange={(e) => setPregunta(e.target.value)} placeholder="Escribí la pregunta" />
          </div>

          <div className="field">
            <label className="label">Imagen de la pregunta (opcional)</label>
            <input className="input" type="file" accept="image/*" onChange={subirImagenPregunta} />
            {subiendo && <p className="muted">Subiendo imagen...</p>}
            {imagenUrl && (
              <div className="stack-sm" style={{ marginTop: "0.5rem" }}>
                <img src={imagenUrl} alt="" style={{ borderRadius: "var(--r-md)", border: "1px solid var(--border)" }} />
                <button onClick={() => setImagenUrl("")} className="btn btn-danger btn-sm" style={{ alignSelf: "flex-start" }}>Quitar imagen</button>
              </div>
            )}
          </div>
        </div>

        <div className="stack-sm">
          <label className="label">Opciones (marcá la correcta) — texto y/o imagen</label>
          {opciones.map((op, i) => (
            <div key={i} className="card" style={{ background: "var(--bg-subtle)", padding: "0.9rem" }}>
              <div className="row" style={{ gap: "0.6rem", flexWrap: "nowrap" }}>
                <input type="radio" name="correcta" checked={correcta === i} onChange={() => setCorrecta(i)} style={{ accentColor: "var(--brand)", width: 18, height: 18 }} />
                <input className="input" value={op} onChange={(e) => cambiarOpcion(i, e.target.value)} placeholder={`Opción ${i + 1}`} />
              </div>
              <div style={{ marginTop: "0.6rem", paddingLeft: "1.8rem" }}>
                <input type="file" accept="image/*" onChange={(e) => subirImagenOpcion(i, e)} />
                {subiendoOp === i && <span className="muted"> subiendo...</span>}
                {opcionesImg[i] && (
                  <div className="stack-sm" style={{ marginTop: "0.4rem" }}>
                    <img src={opcionesImg[i]} alt="" style={{ maxWidth: "120px", borderRadius: "var(--r-sm)", border: "1px solid var(--border)" }} />
                    <button onClick={() => quitarImagenOpcion(i)} className="btn btn-danger btn-sm" style={{ alignSelf: "flex-start" }}>Quitar</button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="field" style={{ marginBottom: 0 }}>
          <label className="label">Explicación (opcional)</label>
          <textarea className="textarea" value={explicacion} onChange={(e) => setExplicacion(e.target.value)} placeholder="Por qué es correcta" />
        </div>

        <button onClick={guardar} disabled={guardando} className="btn btn-primary btn-lg btn-block">
          {guardando ? "Guardando..." : "Guardar pregunta"}
        </button>

        {mensaje && <Notice message={mensaje} success={exito} />}
      </div>
    </main>
  );
}

export default function NuevaPregunta() {
  return (
    <Suspense fallback={<div className="page" style={{ textAlign: "center" }}>Cargando...</div>}>
      <FormularioNuevaPregunta />
    </Suspense>
  );
}