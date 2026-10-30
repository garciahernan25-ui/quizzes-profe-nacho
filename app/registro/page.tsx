"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Navbar from "../components/Navbar";
import { Notice } from "../components/icons";

// Opciones que arma el admin en /admin/escuelas
type Curso = { id: string; name: string };
type Escuela = { id: string; name: string; cursos: Curso[] };
type Modalidad = { id: string; name: string; escuelas: Escuela[] };

export default function Registro() {
  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [opciones, setOpciones] = useState<Modalidad[] | null>(null);
  const [modalidadId, setModalidadId] = useState("");
  const [escuelaId, setEscuelaId] = useState("");
  const [cursoId, setCursoId] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    fetch("/api/opciones-registro")
      .then((r) => r.json())
      .then((data) => setOpciones(data))
      .catch(() => setOpciones([]));
  }, []);

  // Cada lista muestra solo lo que corresponde a lo elegido en la anterior
  const escuelas = opciones?.find((m) => m.id === modalidadId)?.escuelas ?? [];
  const cursos = escuelas.find((e) => e.id === escuelaId)?.cursos ?? [];

  function elegirModalidad(id: string) {
    setModalidadId(id);
    setEscuelaId("");
    setCursoId("");
  }

  function elegirEscuela(id: string) {
    setEscuelaId(id);
    setCursoId("");
  }

  async function registrar() {
    if (!fullName || !username || !password || !cursoId) {
      setMensaje("Completá todos los datos.");
      return;
    }
    setGuardando(true);
    setMensaje("");
    const res = await fetch("/api/registro", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fullName, username, password, courseId: cursoId }),
    });
    const data = await res.json();
    setGuardando(false);
    if (data.ok) {
      setMensaje("✓ ¡Cuenta creada! Iniciá sesión: el profe tiene que aprobar tu usuario antes de que veas los quizzes.");
    } else {
      setMensaje("✗ " + (data.error || "No se pudo registrar."));
    }
  }

  const exito = mensaje.startsWith("✓");

  return (
    <>
      <Navbar
        back={{ href: "/", label: "Volver" }}
        right={<Link href="/ingresar" className="btn btn-ghost btn-sm">Iniciar sesión</Link>}
      />
      <main className="page page-narrow animate-in" style={{ paddingTop: "clamp(1.5rem, 5vh, 3rem)" }}>
      <div className="card card-pad-lg stack-md">
        <header className="stack-sm">
          <h1 className="h1">Crear cuenta</h1>
          <p className="lead">Registrate para guardar tu progreso.</p>
        </header>

        <div>
          <div className="field">
            <label className="label">Nombre y apellido</label>
            <input className="input" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Ej: Juan Pérez" />
          </div>

          <div className="field">
            <label className="label">Usuario (para entrar)</label>
            <input className="input" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Ej: juanperez23" />
          </div>

          <div className="field">
            <label className="label">Contraseña</label>
            <input className="input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>

          {opciones === null ? (
            <p className="muted">Cargando escuelas...</p>
          ) : opciones.length === 0 ? (
            <p className="notice notice-error">Todavía no hay cursos cargados. Avisale a tu profe.</p>
          ) : (
            <>
              <div className="field">
                <label className="label">Modalidad</label>
                <select className="select" value={modalidadId} onChange={(e) => elegirModalidad(e.target.value)}>
                  <option value="">Elegí una...</option>
                  {opciones.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
                </select>
              </div>

              {modalidadId && (
                <div className="field">
                  <label className="label">Escuela</label>
                  <select className="select" value={escuelaId} onChange={(e) => elegirEscuela(e.target.value)}>
                    <option value="">Elegí tu escuela...</option>
                    {escuelas.map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}
                  </select>
                </div>
              )}

              {escuelaId && (
                <div className="field">
                  <label className="label">Curso</label>
                  <select className="select" value={cursoId} onChange={(e) => setCursoId(e.target.value)}>
                    <option value="">Elegí tu curso...</option>
                    {cursos.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
              )}
            </>
          )}
        </div>

        <button onClick={registrar} disabled={guardando || !opciones?.length} className="btn btn-primary btn-lg btn-block">
          {guardando ? "Creando..." : "Crear cuenta"}
        </button>

        {mensaje && <Notice message={mensaje} success={exito} />}
      </div>
      </main>
    </>
  );
}
