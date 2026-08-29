"use client";

import { useState } from "react";

export default function BotonBorrarQuiz({ quizId, titulo }: { quizId: string; titulo: string }) {
  const [borrando, setBorrando] = useState(false);

  async function borrar() {
    if (!confirm(`¿Seguro que querés borrar el quiz "${titulo}"?\n\nSe van a borrar también todas sus secciones y preguntas. Esto no se puede deshacer.`)) {
      return;
    }
    setBorrando(true);
    const res = await fetch("/api/quizzes/borrar", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ quizId }),
    });
    if (res.ok) {
      window.location.reload();
    } else {
      alert("Hubo un error al borrar el quiz.");
      setBorrando(false);
    }
  }

  return (
    <button onClick={borrar} disabled={borrando} className="btn btn-danger btn-sm">
      {borrando ? "Borrando..." : "Borrar"}
    </button>
  );
}