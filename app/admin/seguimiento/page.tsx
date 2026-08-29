"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft } from "../../components/icons";

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
    if (nota >= 7) return "var(--success)";
    if (nota >= 5) return "var(--warning)";
    return "var(--danger)";
  }

  return (
    <main className="page page-mid stack-lg animate-in" style={{ paddingTop: "clamp(1.5rem, 5vh, 3rem)" }}>
      <Link href="/admin" className="back-link"><ArrowLeft size={16} /> Volver al panel</Link>
      <h1 className="h1">Seguimiento de alumnos</h1>

      {cargando ? (
        <p className="lead">Cargando...</p>
      ) : alumnos.length === 0 ? (
        <div className="card" style={{ textAlign: "center" }}>
          <p className="lead">Todavía no hay alumnos registrados.</p>
        </div>
      ) : (
        <div className="stack-lg">
          {nombresGrupos.map((nombre) => {
            const delGrupo = grupos[nombre];
            const promGrupo = Math.round(
              delGrupo.reduce((acc, a) => acc + a.promedio, 0) / delGrupo.length * 10
            ) / 10;
            return (
              <div key={nombre} className="stack-sm">
                <div className="card" style={{ padding: "0.9rem 1.1rem" }}>
                  <div style={{ fontWeight: 650, fontSize: "1.05rem", wordBreak: "break-word" }}>{nombre}</div>
                  <div className="muted">
                    {delGrupo.length} alumno(s) · promedio del grupo:{" "}
                    <b style={{ color: colorNota(promGrupo) }}>{promGrupo.toFixed(1)}</b>
                  </div>
                </div>

                <div className="grid-1">
                  {delGrupo
                    .sort((a, b) => a.fullName.localeCompare(b.fullName))
                    .map((a) => (
                      <div key={a.id} className="card row between" style={{ padding: "0.9rem 1.1rem" }}>
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontWeight: 600, wordBreak: "break-word" }}>{a.fullName}</div>
                          <div className="muted">Quizzes jugados: {a.cantQuizzes}</div>
                        </div>
                        <div className="row" style={{ gap: "0.75rem", flexShrink: 0 }}>
                          <span style={{ fontWeight: 700, color: a.cantQuizzes > 0 ? colorNota(a.promedio) : "var(--text-muted)" }}>
                            {a.cantQuizzes > 0 ? `${a.promedio.toFixed(1)} / 10` : "—"}
                          </span>
                          <button onClick={() => borrarAlumno(a.id, a.fullName)} className="btn btn-danger btn-sm">
                            Eliminar
                          </button>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </main>
  );
}