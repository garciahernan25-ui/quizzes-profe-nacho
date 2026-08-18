"use client";

import { useState } from "react";

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

  const input = { width: "100%", padding: "0.8rem", borderRadius: "8px", border: "1px solid #ccc", fontSize: "1rem", marginBottom: "1rem" } as const;

  return (
    <main style={{ padding: "3rem", maxWidth: "400px", margin: "0 auto", textAlign: "center" }}>
      <a href="/" style={{ color: "#2563eb", textDecoration: "none", display: "block", textAlign: "left", marginBottom: "1rem" }}>← Volver</a>
      <h1 style={{ fontSize: "1.8rem", fontWeight: "bold", marginBottom: "0.5rem" }}>Iniciar sesión</h1>
      <p style={{ color: "#555", marginBottom: "2rem" }}>Ingresá para que se guarden tus resultados.</p>

      <input
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        placeholder="Usuario"
        style={input}
      />
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        onKeyDown={(e) => { if (e.key === "Enter") entrar(); }}
        placeholder="Contraseña"
        style={input}
      />

      <button
        onClick={entrar}
        disabled={entrando}
        style={{ width: "100%", padding: "0.9rem", borderRadius: "10px", border: "none", background: "#2563eb", color: "white", fontSize: "1.1rem", fontWeight: "bold", cursor: "pointer" }}
      >
        {entrando ? "Entrando..." : "Entrar"}
      </button>

      {error && <p style={{ marginTop: "1rem", color: "#ef4444", fontWeight: "bold" }}>{error}</p>}

      <p style={{ marginTop: "1.5rem", color: "#555" }}>
        ¿No tenés cuenta? <a href="/registro" style={{ color: "#2563eb" }}>Registrate acá</a>
      </p>
    </main>
  );
}