"use client";

import { LogOut } from "../components/icons";

export default function BotonSalir() {
  async function salir() {
    await fetch("/api/logout", { method: "POST" });
    window.location.href = "/admin/login";
  }

  return (
    <button onClick={salir} className="btn btn-ghost btn-sm">
      <LogOut size={15} /> Cerrar sesión
    </button>
  );
}
