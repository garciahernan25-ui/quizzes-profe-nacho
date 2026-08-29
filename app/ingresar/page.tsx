"use client";

import { useState } from "react";
import Link from "next/link";
import Navbar from "../components/Navbar";

export default function Ingresar() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [entrando, setEntrando] = useState(false);

  async function entrar() {
    if (!username || !password) {
      setError("Completá usuario y contraseña.");
      return;
    }
    setEntrando(true);
    setError("");
    const res = await fetch("/api/login-estudiante", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });
    setEntrando(false);
    if (res.ok) {
      window.location.href = "/";
    } else {
      setError("Usuario o contraseña incorrectos.");
    }
  }

  return (
    <>
      <Navbar
        back={{ href: "/", label: "Volver" }}
        right={<Link href="/registro" className="btn btn-ghost btn-sm">Crear cuenta</Link>}
      />
      <main className="page page-narrow animate-in" style={{ paddingTop: "clamp(2rem, 8vh, 5rem)" }}>
      <div className="card card-pad-lg stack-md">
        <header className="stack-sm">
          <h1 className="h1">Iniciar sesión</h1>
          <p className="lead">Ingresá para que se guarden tus resultados.</p>
        </header>

        <div>
          <div className="field">
            <label className="label">Usuario</label>
            <input
              className="input"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Tu usuario"
            />
          </div>
          <div className="field">
            <label className="label">Contraseña</label>
            <input
              className="input"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") entrar(); }}
              placeholder="Tu contraseña"
            />
          </div>
        </div>

        <button onClick={entrar} disabled={entrando} className="btn btn-primary btn-lg btn-block">
          {entrando ? "Entrando..." : "Entrar"}
        </button>

        {error && <p className="notice notice-error">{error}</p>}

        <p className="muted" style={{ textAlign: "center" }}>
          ¿No tenés cuenta?{" "}
          <Link href="/registro" style={{ color: "var(--brand-hover)", fontWeight: 600 }}>
            Registrate acá
          </Link>
        </p>
      </div>
      </main>
    </>
  );
}
