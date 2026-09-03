"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Plus, Check, Notice } from "../../components/icons";

export default function NuevoQuiz() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [icon, setIcon] = useState("");
  const [subject, setSubject] = useState("");
  const [level, setLevel] = useState("");
  const [timeLimit, setTimeLimit] = useState<number | null>(null); // NUEVO
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
      body: JSON.stringify({ title, description, icon, subject, level, timeLimit }),
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

  const exito = mensaje.startsWith("✓");

  // Si el quiz ya se creó, mostramos la pantalla de "listo, cargá preguntas"
  if (rondaCreada) {
    return (
      <main className="page page-narrow animate-in" style={{ paddingTop: "clamp(2rem, 8vh, 5rem)" }}>
        <div className="card card-pad-lg stack-md" style={{ textAlign: "center" }}>
          <div className="brand-logo" style={{ margin: "0 auto", width: 48, height: 48, background: "linear-gradient(140deg, #23b56a, #2fd27a)", color: "#04120a" }}><Check size={24} /></div>
          <h1 className="h1">¡Quiz creado!</h1>
          <p className="lead">Ahora podés cargarle preguntas.</p>
          <Link href={`/admin/nueva-pregunta?ronda=${rondaCreada}`} className="btn btn-primary btn-lg" style={{ alignSelf: "center" }}>
            <Plus size={18} /> Agregar preguntas
          </Link>
          <Link href="/admin" className="back-link" style={{ alignSelf: "center" }}><ArrowLeft size={16} /> Volver al panel</Link>
        </div>
      </main>
    );
  }

  return (
    <main className="page page-narrow animate-in" style={{ paddingTop: "clamp(1.5rem, 5vh, 3rem)" }}>
      <Link href="/admin" className="back-link" style={{ marginBottom: "1.5rem" }}><ArrowLeft size={16} /> Volver al panel</Link>

      <div className="card card-pad-lg stack-md">
        <h1 className="h1">Nuevo quiz</h1>

        <div>
          <div className="field">
            <label className="label">Título del quiz *</label>
            <input className="input" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ej: Tabla periódica" />
          </div>
          <div className="field">
            <label className="label">Descripción</label>
            <input className="input" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="De qué trata" />
          </div>
          <div className="field">
            <label className="label">Ícono (un emoji)</label>
            <input className="input" value={icon} onChange={(e) => setIcon(e.target.value)} placeholder="Ej: 🧪" />
          </div>
          <div className="field">
            <label className="label">Materia</label>
            <input className="input" value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Ej: Química" />
          </div>
          <div className="field">
            <label className="label">Nivel</label>
            <input className="input" value={level} onChange={(e) => setLevel(e.target.value)} placeholder="Ej: Secundaria" />
          </div>
          <div className="field">
            <label className="label">Tiempo por pregunta</label>
            <select
              className="input"
              value={timeLimit === null ? "" : String(timeLimit)}
              onChange={(e) => setTimeLimit(e.target.value === "" ? null : Number(e.target.value))}
            >
              <option value="">Sin límite</option>
              <option value="5">5 segundos</option>
              <option value="10">10 segundos</option>
              <option value="15">15 segundos</option>
              <option value="20">20 segundos</option>
              <option value="30">30 segundos</option>
            </select>
          </div>
        </div>

        <button onClick={guardar} disabled={guardando} className="btn btn-primary btn-lg btn-block">
          {guardando ? "Creando..." : "Crear quiz"}
        </button>

        {mensaje && <Notice message={mensaje} success={exito} />}
      </div>
    </main>
  );
}