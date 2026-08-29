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
    <button onClick={cerrarSesion} className="btn btn-ghost btn-sm">
      Cerrar sesión
    </button>
  );
}
