"use client";

import { useState } from "react";
import Navbar from "../../components/Navbar";
import { Sparkle } from "../../components/icons";

export default function LoginAdmin() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [entrando, setEntrando] = useState(false);

  async function entrar() {
    setEntrando(true);
    setError("");
    const res = await fetch("/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    setEntrando(false);
    if (res.ok) {
      window.location.href = "/admin";
    } else {
      setError("Contraseña incorrecta. Probá de nuevo.");
    }
  }

  return (
    <>
      <Navbar back={{ href: "/", label: "Volver al inicio" }} />
      <main className="page page-narrow animate-in" style={{ paddingTop: "clamp(2rem, 10vh, 6rem)" }}>
      <div className="card card-pad-lg stack-md">
        <header className="stack-sm" style={{ textAlign: "center" }}>
          <div className="brand-logo" style={{ margin: "0 auto 0.5rem", width: 44, height: 44 }}>
            <Sparkle size={22} />
          </div>
          <h1 className="h1">Panel de administración</h1>
          <p className="lead">Ingresá tu contraseña para continuar.</p>
        </header>

        <div className="field" style={{ marginBottom: 0 }}>
          <label className="label">Contraseña</label>
          <input
            className="input"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") entrar(); }}
            placeholder="Contraseña"
          />
        </div>

        <button onClick={entrar} disabled={entrando} className="btn btn-primary btn-lg btn-block">
          {entrando ? "Entrando..." : "Entrar"}
        </button>

        {error && <p className="notice notice-error">{error}</p>}
      </div>
      </main>
    </>
  );
}