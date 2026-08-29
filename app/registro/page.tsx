"use client";

import { useState } from "react";
import Link from "next/link";
import Navbar from "../components/Navbar";
import { Notice } from "../components/icons";

const MODALIDADES = ["Secundaria", "Secundaria Técnica", "EPS", "Adulto CENS", "FinES", "Terciario"];
const ANIOS = ["1ro", "2do", "3ro", "4to", "5to", "6to", "7mo"];
const DIVISIONES = ["1ra", "2da", "3ra", "4ta", "5ta", "6ta", "A", "B", "C", "D", "E"];

// Modalidades que usan año + división
const CON_ANIO = ["Secundaria", "Secundaria Técnica", "Adulto CENS", "Terciario"];

export default function Registro() {
  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [modality, setModality] = useState("");
  const [school, setSchool] = useState("");
  const [year, setYear] = useState("");
  const [division, setDivision] = useState("");
  const [extraInfo, setExtraInfo] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [guardando, setGuardando] = useState(false);

  const usaAnio = CON_ANIO.includes(modality);
  const usaExtra = modality === "EPS" || modality === "FinES";

  async function registrar() {
    if (!fullName || !username || !password || !modality || !school) {
      setMensaje("Completá todos los datos.");
      return;
    }
    if (usaAnio && (!year || !division)) {
      setMensaje("Completá año y división.");
      return;
    }
    if (usaExtra && !extraInfo) {
      setMensaje(`Completá cuál ${modality} es.`);
      return;
    }
    setGuardando(true);
    setMensaje("");
    const res = await fetch("/api/registro", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fullName,
        username,
        password,
        modality,
        school,
        year: usaAnio ? year : null,
        division: usaAnio ? division : null,
        extraInfo: usaExtra ? extraInfo : null,
      }),
    });
    const data = await res.json();
    setGuardando(false);
    if (data.ok) {
      setMensaje("✓ ¡Cuenta creada! Ya podés iniciar sesión.");
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

          <div className="field">
            <label className="label">Modalidad</label>
            <select className="select" value={modality} onChange={(e) => setModality(e.target.value)}>
              <option value="">Elegí una...</option>
              {MODALIDADES.map((m) => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>

          <div className="field">
            <label className="label">Escuela</label>
            <input className="input" value={school} onChange={(e) => setSchool(e.target.value)} placeholder="Nombre de la escuela" />
          </div>

          {usaAnio && (
            <>
              <div className="field">
                <label className="label">Año</label>
                <select className="select" value={year} onChange={(e) => setYear(e.target.value)}>
                  <option value="">Elegí...</option>
                  {ANIOS.map((a) => <option key={a} value={a}>{a}</option>)}
                </select>
              </div>

              <div className="field">
                <label className="label">División</label>
                <select className="select" value={division} onChange={(e) => setDivision(e.target.value)}>
                  <option value="">Elegí...</option>
                  {DIVISIONES.map((d) => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
            </>
          )}

          {usaExtra && (
            <div className="field">
              <label className="label">¿Cuál {modality} es?</label>
              <input className="input" value={extraInfo} onChange={(e) => setExtraInfo(e.target.value)} placeholder={`Nombre o número de ${modality}`} />
            </div>
          )}
        </div>

        <button onClick={registrar} disabled={guardando} className="btn btn-primary btn-lg btn-block">
          {guardando ? "Creando..." : "Crear cuenta"}
        </button>

        {mensaje && <Notice message={mensaje} success={exito} />}
      </div>
      </main>
    </>
  );
}