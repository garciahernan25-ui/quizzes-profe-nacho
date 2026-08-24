"use client";

import { useState, useEffect } from "react";

type Alumno = {
  id: string;
  fullName: string;
  modality: string;
  school: string;
  year: string | null;
  division: string | null;
  extraInfo: string | null;
  cantQuizzes: number;
  promedio: number;
};

export default function Seguimiento() {
  const [alumnos, setAlumnos] = useState<Alumno[]>([]);
  const [cargando, setCargando] = useState(true);

  function cargar() {
    fetch("/api/seguimiento")
      .then((r) => r.json())
      .then((data) => {
        setAlumnos(data);
        setCargando(false);
      });
  }

  useEffect(() => {
    cargar();
  }, []);

  async function borrarAlumno(id: string, nombre: string) {
    if (!confirm(`¿Seguro que querés eliminar a ${nombre}?`)) return;
    const res = await fetch("/api/estudiantes/borrar", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    if (res.ok) {
      cargar();
    } else {
      alert("Hubo un error al eliminar al alumno.");
    }
  }

  function nombreGrupo(a: Alumno) {
    let grupo = `${a.modality} · ${a.school}`;
    if (a.extraInfo) grupo += ` · ${a.extraInfo}`;
    if (a.year) grupo += ` · ${a.year}`;
    if (a.division) grupo += ` ${a.division}`;
    return grupo;
  }

  const grupos: { [nombre: string]: Alumno[] } = {};
  for (const a of alumnos) {
    const g = nombreGrupo(a);
    if (!grupos[g]) grupos[g] = [];
    grupos[g].push(a);
  }
  const nombresGrupos = Object.keys(grupos).sort();

  function colorNota(nota: number) {
    if (nota >= 7) return "#16a34a";
    if (nota >= 5) return "#f59e0b";
    return "#ef4444";
  }

  return (
    <main style={{ padding: "1rem", maxWidth: "900px", margin: "0 auto" }}>
      <a href="/admin" style={{ color: "var(--button-bg)", textDecoration: "none" }}>
        ← Volver al panel
      </a>
      <h1 style={{ fontSize: "1.8rem", fontWeight: "bold", margin: "1rem 0" }}>
        Seguimiento de alumnos
      </h1>

      {cargando ? (
        <p>Cargando...</p>
      ) : alumnos.length === 0 ? (
        <p style={{ color: "var(--text-secondary)" }}>
          Todavía no hay alumnos registrados.
        </p>
      ) : (
        nombresGrupos.map((nombre) => {
          const delGrupo = grupos[nombre];
          const promGrupo = Math.round(
            delGrupo.reduce((acc, a) => acc + a.promedio, 0) / delGrupo.length * 10
          ) / 10;
          return (
            <div key={nombre} style={{ marginBottom: "2.5rem" }}>
              <div
                style={{
                  background: "var(--card-bg)",
                  padding: "0.8rem 1rem",
                  borderRadius: "10px",
                  marginBottom: "0.8rem",
                  border: "1px solid var(--card-border)",
                }}
              >
                <div style={{ fontWeight: "bold", fontSize: "1.1rem", wordBreak: "break-word" }}>
                  {nombre}
                </div>
                <div style={{ color: "var(--text-secondary)", fontSize: "0.9rem" }}>
                  {delGrupo.length} alumno(s) · nota promedio del grupo:{" "}
                  <b style={{ color: colorNota(promGrupo) }}>{promGrupo.toFixed(1)}</b>
                </div>
              </div>

              <div style={{ display: "grid", gap: "0.8rem" }}>
                {delGrupo
                  .sort((a, b) => a.fullName.localeCompare(b.fullName))
                  .map((a) => (
                    <div
                      key={a.id}
                      style={{
                        border: "1px solid var(--card-border)",
                        borderRadius: "10px",
                        background: "var(--card-bg)",
                        padding: "0.8rem",
                        display: "flex",
                        flexDirection: "column",
                        gap: "0.5rem",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          gap: "0.5rem",
                          flexWrap: "wrap",
                        }}
                      >
                        <span style={{ fontWeight: "bold", wordBreak: "break-word" }}>
                          {a.fullName}
                        </span>
                        <span
                          style={{
                            fontSize: "0.85rem",
                            fontWeight: "bold",
                            color: a.cantQuizzes > 0 ? colorNota(a.promedio) : "var(--text-muted)",
                          }}
                        >
                          {a.cantQuizzes > 0 ? `${a.promedio.toFixed(1)} / 10` : "—"}
                        </span>
                      </div>

                      <div style={{ color: "var(--text-secondary)", fontSize: "0.9rem" }}>
                        Quizzes jugados: {a.cantQuizzes}
                      </div>

                      <div style={{ display: "flex", justifyContent: "flex-end" }}>
                        <button
                          onClick={() => borrarAlumno(a.id, a.fullName)}
                          style={{
                            padding: "0.3rem 0.7rem",
                            borderRadius: "6px",
                            border: "1px solid #ef4444",
                            background: "var(--card-bg)",
                            color: "#ef4444",
                            cursor: "pointer",
                            fontSize: "0.85rem",
                            whiteSpace: "nowrap",
                          }}
                        >
                          Eliminar
                        </button>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          );
        })
      )}
    </main>
  );
}