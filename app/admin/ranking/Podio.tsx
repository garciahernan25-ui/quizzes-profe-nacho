"use client";

import type { CSSProperties } from "react";

type Puesto = { id: string; nombre: string; puntos: number };

const COLORES = ["#ffcf3f", "#6d5efc", "#2fd27a", "#ff5c72", "#4b8dff", "#ff9f43"];

// Papelitos con posiciones fijas (no al azar) para que se dibujen siempre igual
const PAPELITOS = Array.from({ length: 90 }, (_, i) => ({
  left: `${(i * 37) % 100}%`,
  "--espera": `${((i * 0.29) % 3).toFixed(2)}s`,
  "--dur": `${(3.2 + (i % 5) * 0.55).toFixed(2)}s`,
  "--deriva": `${((i % 7) - 3) * 4}vw`,
  "--giro": `${(i % 2 ? 1 : -1) * (360 + (i % 4) * 180)}deg`,
  background: COLORES[i % COLORES.length],
})) as CSSProperties[];

const MEDALLAS = ["🥇", "🥈", "🥉"];

// Podio con 1°, 2° y 3° en grande. En pantalla va 2° - 1° - 3°, como un podio de verdad.
export default function Podio({ puestos }: { puestos: Puesto[] }) {
  const orden = [1, 0, 2];
  return (
    <>
      <div className="confeti" aria-hidden>
        {PAPELITOS.map((estilo, i) => (
          <span key={i} style={estilo} />
        ))}
      </div>
      <div className="podio">
        {orden.map((lugar) => {
          const p = puestos[lugar];
          return (
            <div key={lugar} className={`podio-puesto podio-${lugar + 1}`} style={{ visibility: p ? "visible" : "hidden" }}>
              <div className="podio-texto stack-sm" style={{ alignItems: "center", gap: "0.3rem", maxWidth: "100%" }}>
                <span className="podio-medalla" aria-hidden>{MEDALLAS[lugar]}</span>
                <span className="podio-nombre">{p?.nombre ?? "—"}</span>
                <span className="podio-puntos">{p?.puntos ?? 0} puntos</span>
              </div>
              <div className="podio-bloque">{lugar + 1}°</div>
            </div>
          );
        })}
      </div>
    </>
  );
}
