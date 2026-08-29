"use client";

import { useState } from "react";
import { Check } from "../components/icons";

export default function BotonCopiar({ slug }: { slug: string }) {
  const [copiado, setCopiado] = useState(false);

  function copiar() {
    const url = `${window.location.origin}/quiz/${slug}`;
    navigator.clipboard.writeText(url);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  }

  return (
    <button onClick={copiar} className={`btn btn-sm ${copiado ? "btn-success" : "btn-ghost"}`}>
      {copiado ? <><Check size={15} /> Copiado</> : "Copiar enlace"}
    </button>
  );
}