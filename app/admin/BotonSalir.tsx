"use client";

export default function BotonSalir() {
  async function salir() {
    await fetch("/api/logout", { method: "POST" });
    window.location.href = "/admin/login";
  }

  return (
    <button
      onClick={salir}
      style={{
        padding: "0.5rem 1rem", borderRadius: "8px", border: "1px solid #6b7280",
        background: "white", color: "#6b7280", cursor: "pointer", fontSize: "0.9rem",
      }}
    >
      Cerrar sesión
    </button>
  );
}