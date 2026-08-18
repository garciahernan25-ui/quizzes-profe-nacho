"use client";

import { useState } from "react";

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
    <main style={{ padding: "3rem", maxWidth: "400px", margin: "0 auto", textAlign: "center" }}>
      <h1 style={{ fontSize: "1.8rem", fontWeight: "bold", marginBottom: "0.5rem" }}>Panel de administración</h1>
      <p style={{ color: "#555", marginBottom: "2rem" }}>Ingresá tu contraseña para continuar.</p>

      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        onKeyDown={(e) => { if (e.key === "Enter") entrar(); }}
        placeholder="Contraseña"
        style={{ width: "100%", padding: "0.8rem", borderRadius: "8px", border: "1px solid #ccc", fontSize: "1rem", marginBottom: "1rem" }}
      />

      <button
        onClick={entrar}
        disabled={entrando}
        style={{ width: "100%", padding: "0.9rem", borderRadius: "10px", border: "none", background: "#2563eb", color: "white", fontSize: "1.1rem", fontWeight: "bold", cursor: "pointer" }}
      >
        {entrando ? "Entrando..." : "Entrar"}
      </button>

      {error && <p style={{ marginTop: "1rem", color: "#ef4444", fontWeight: "bold" }}>{error}</p>}
    </main>
  );
}