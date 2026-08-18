"use client";

import { useState } from "react";

export default function BotonCopiar({ slug }: { slug: string }) {
  const [copiado, setCopiado] = useState(false);

  function copiar() {
    const url = `${window.location.origin}/quiz/${slug}`;
    navigator.clipboard.writeText(url);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  }

  return (
    <button
      onClick={copiar}
      style={{
        padding: "0.4rem 0.8rem", borderRadius: "8px", border: "1px solid #2563eb",
        background: copiado ? "#dcfce7" : "white", color: "#2563eb",
        cursor: "pointer", fontSize: "0.85rem", whiteSpace: "nowrap",
      }}
    >
      {copiado ? "✓ Copiado" : "Copiar enlace"}
    </button>
  );
}