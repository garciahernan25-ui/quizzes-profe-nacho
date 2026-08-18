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
    <button
      onClick={borrar}
      disabled={borrando}
      style={{
        padding: "0.4rem 0.8rem", borderRadius: "8px", border: "1px solid #ef4444",
        background: "white", color: "#ef4444", cursor: "pointer",
        fontSize: "0.85rem", whiteSpace: "nowrap",
      }}
    >
      {borrando ? "Borrando..." : "Borrar"}
    </button>
  );
}