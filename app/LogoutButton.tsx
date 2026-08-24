"use client";

export default function LogoutButton() {
  async function cerrarSesion() {
    try {
      await fetch("/api/logout-estudiante", { method: "POST" });
      window.location.reload();
    } catch (error) {
      console.error("Error al cerrar sesión", error);
    }
  }

  return (
    <button
      onClick={cerrarSesion}
      style={{
        padding: "0.5rem 1.2rem",
        borderRadius: "8px",
        border: "1px solid #ef4444",
        background: "var(--card-bg)",
        color: "#ef4444",
        cursor: "pointer",
        fontSize: "0.9rem",
        fontWeight: "bold",
      }}
    >
      Cerrar sesión
    </button>
  );
}