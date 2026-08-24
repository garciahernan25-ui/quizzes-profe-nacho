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

  function colorPromedio(p: number) {
    if (p >= 70) return "#16a34a";
    if (p >= 50) return "#f59e0b";
    return "#ef4444";
  }

  return (
    <main style={{ padding: "2rem 1rem", maxWidth: "900px", margin: "0 auto" }}>
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
            delGrupo.reduce((acc, a) => acc + a.promedio, 0) / delGrupo.length
          );
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
                <div style={{ fontWeight: "bold", fontSize: "1.1rem" }}>{nombre}</div>
                <div style={{ color: "var(--text-secondary)", fontSize: "0.9rem" }}>
                  {delGrupo.length} alumno(s) · promedio del grupo:{" "}
                  <b style={{ color: colorPromedio(promGrupo) }}>{promGrupo}%</b>
                </div>
              </div>

              <div style={{ overflowX: "auto" }}>
                <table
                  style={{
                    width: "100%",
                    borderCollapse: "collapse",
                    minWidth: "550px",
                  }}
                >
                  <thead>
                    <tr style={{ borderBottom: "2px solid var(--card-border)", textAlign: "left" }}>
                      <th style={{ padding: "0.6rem" }}>Alumno</th>
                      <th style={{ padding: "0.6rem" }}>Quizzes jugados</th>
                      <th style={{ padding: "0.6rem" }}>Promedio</th>
                      <th style={{ padding: "0.6rem" }}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {delGrupo
                      .sort((a, b) => a.fullName.localeCompare(b.fullName))
                      .map((a) => (
                        <tr key={a.id} style={{ borderBottom: "1px solid var(--card-border)" }}>
                          <td
                            style={{
                              padding: "0.6rem",
                              fontWeight: "bold",
                              wordBreak: "break-word",
                            }}
                          >
                            {a.fullName}
                          </td>
                          <td style={{ padding: "0.6rem" }}>{a.cantQuizzes}</td>
                          <td
                            style={{
                              padding: "0.6rem",
                              fontWeight: "bold",
                              color: colorPromedio(a.promedio),
                            }}
                          >
                            {a.cantQuizzes > 0 ? `${a.promedio}%` : "—"}
                          </td>
                          <td style={{ padding: "0.6rem", textAlign: "right" }}>
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
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          );
        })
      )}
    </main>
  );
}