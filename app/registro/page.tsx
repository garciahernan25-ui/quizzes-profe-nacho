"use client";

import { useState } from "react";

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
        fullName, username, password, modality, school,
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

  const label = { display: "block", fontWeight: "bold", margin: "1rem 0 0.3rem" } as const;
  const input = { width: "100%", padding: "0.6rem", borderRadius: "8px", border: "1px solid #ccc", fontSize: "1rem" } as const;

  return (
    <main style={{ padding: "3rem", maxWidth: "500px", margin: "0 auto" }}>
      <a href="/" style={{ color: "#2563eb", textDecoration: "none" }}>← Volver</a>
      <h1 style={{ fontSize: "1.8rem", fontWeight: "bold", margin: "1rem 0" }}>Crear cuenta de estudiante</h1>

      <label style={label}>Nombre y apellido</label>
      <input value={fullName} onChange={(e) => setFullName(e.target.value)} style={input} placeholder="Ej: Juan Pérez" />

      <label style={label}>Usuario (para entrar)</label>
      <input value={username} onChange={(e) => setUsername(e.target.value)} style={input} placeholder="Ej: juanperez23" />

      <label style={label}>Contraseña</label>
      <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} style={input} />

      <label style={label}>Modalidad</label>
      <select value={modality} onChange={(e) => setModality(e.target.value)} style={input}>
        <option value="">Elegí una...</option>
        {MODALIDADES.map((m) => <option key={m} value={m}>{m}</option>)}
      </select>

      <label style={label}>Escuela</label>
      <input value={school} onChange={(e) => setSchool(e.target.value)} style={input} placeholder="Nombre de la escuela" />

      {usaAnio && (
        <>
          <label style={label}>Año</label>
          <select value={year} onChange={(e) => setYear(e.target.value)} style={input}>
            <option value="">Elegí...</option>
            {ANIOS.map((a) => <option key={a} value={a}>{a}</option>)}
          </select>

          <label style={label}>División</label>
          <select value={division} onChange={(e) => setDivision(e.target.value)} style={input}>
            <option value="">Elegí...</option>
            {DIVISIONES.map((d) => <option key={d} value={d}>{d}</option>)}
          </select>
        </>
      )}

      {usaExtra && (
        <>
          <label style={label}>¿Cuál {modality} es?</label>
          <input value={extraInfo} onChange={(e) => setExtraInfo(e.target.value)} style={input} placeholder={`Nombre o número de ${modality}`} />
        </>
      )}

      <button
        onClick={registrar}
        disabled={guardando}
        style={{ marginTop: "1.5rem", width: "100%", padding: "0.9rem", borderRadius: "10px", border: "none", background: "#16a34a", color: "white", fontSize: "1.1rem", fontWeight: "bold", cursor: "pointer" }}
      >
        {guardando ? "Creando..." : "Crear cuenta"}
      </button>

      {mensaje && <p style={{ marginTop: "1rem", textAlign: "center", fontWeight: "bold" }}>{mensaje}</p>}
    </main>
  );
}