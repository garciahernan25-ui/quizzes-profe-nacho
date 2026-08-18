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

  useEffect(() => {
    fetch("/api/seguimiento")
      .then((r) => r.json())
      .then((data) => {
        setAlumnos(data);
        setCargando(false);
      });
  }, []);

  // Armar el nombre del grupo de cada alumno
  function nombreGrupo(a: Alumno) {
    let grupo = `${a.modality} · ${a.school}`;
    if (a.extraInfo) grupo += ` · ${a.extraInfo}`;
    if (a.year) grupo += ` · ${a.year}`;
    if (a.division) grupo += ` ${a.division}`;
    return grupo;
  }

  // Agrupar alumnos por grupo
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
    <main style={{ padding: "3rem", maxWidth: "900px", margin: "0 auto" }}>
      <a href="/admin" style={{ color: "#2563eb", textDecoration: "none" }}>← Volver al panel</a>
      <h1 style={{ fontSize: "1.8rem", fontWeight: "bold", margin: "1rem 0" }}>Seguimiento de alumnos</h1>

      {cargando ? (
        <p>Cargando...</p>
      ) : alumnos.length === 0 ? (
        <p style={{ color: "#555" }}>Todavía no hay alumnos registrados.</p>
      ) : (
        nombresGrupos.map((nombre) => {
          const delGrupo = grupos[nombre];
          const promGrupo = Math.round(
            delGrupo.reduce((acc, a) => acc + a.promedio, 0) / delGrupo.length
          );
          return (
            <div key={nombre} style={{ marginBottom: "2.5rem" }}>
              <div style={{ background: "#f3f4f6", padding: "0.8rem 1rem", borderRadius: "10px", marginBottom: "0.8rem" }}>
                <div style={{ fontWeight: "bold", fontSize: "1.1rem" }}>{nombre}</div>
                <div style={{ color: "#555", fontSize: "0.9rem" }}>
                  {delGrupo.length} alumno(s) · promedio del grupo: <b style={{ color: colorPromedio(promGrupo) }}>{promGrupo}%</b>
                </div>
              </div>

              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ borderBottom: "2px solid #ddd", textAlign: "left" }}>
                    <th style={{ padding: "0.6rem" }}>Alumno</th>
                    <th style={{ padding: "0.6rem" }}>Quizzes jugados</th>
                    <th style={{ padding: "0.6rem" }}>Promedio</th>
                  </tr>
                </thead>
                <tbody>
                  {delGrupo
                    .sort((a, b) => a.fullName.localeCompare(b.fullName))
                    .map((a) => (
                      <tr key={a.id} style={{ borderBottom: "1px solid #eee" }}>
                        <td style={{ padding: "0.6rem", fontWeight: "bold" }}>{a.fullName}</td>
                        <td style={{ padding: "0.6rem" }}>{a.cantQuizzes}</td>
                        <td style={{ padding: "0.6rem", fontWeight: "bold", color: colorPromedio(a.promedio) }}>
                          {a.cantQuizzes > 0 ? `${a.promedio}%` : "—"}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          );
        })
      )}
    </main>
  );
}