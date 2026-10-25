"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft } from "../../components/icons";
import { promedio } from "../../../lib/notas";
import { type Alumno, type DatosSeguimiento, nombreCurso, colorNota } from "./tipos";

export default function Seguimiento() {
  const [datos, setDatos] = useState<DatosSeguimiento | null>(null);

  function cargar() {
    fetch("/api/seguimiento")
      .then((r) => r.json())
      .then((data) => setDatos(data));
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

  if (!datos) {
    return (
      <main className="page page-mid stack-lg animate-in" style={{ paddingTop: "clamp(1.5rem, 5vh, 3rem)" }}>
        <p className="lead">Cargando...</p>
      </main>
    );
  }

  const sinAsignar = datos.alumnos.filter((a) => !a.courseId);
  // Solo los cursos que tienen alumnos
  const cursosConAlumnos = datos.cursos
    .map((c) => ({ curso: c, alumnos: datos.alumnos.filter((a) => a.courseId === c.id) }))
    .filter((g) => g.alumnos.length > 0);

  return (
    <main className="page page-mid stack-lg animate-in" style={{ paddingTop: "clamp(1.5rem, 5vh, 3rem)" }}>
      <Link href="/admin" className="back-link"><ArrowLeft size={16} /> Volver al panel</Link>
      <div className="row between">
        <h1 className="h1">Seguimiento de alumnos</h1>
        <Link href="/admin/seguimiento/asignar" className="btn btn-ghost btn-sm">Asignar alumnos a cursos</Link>
      </div>

      {sinAsignar.length > 0 && (
        <div className="notice notice-error stack-sm" style={{ textAlign: "left" }}>
          <div>
            Hay <b>{sinAsignar.length}</b> alumno(s) sin curso. Sus notas están guardadas, pero no cuentan para ningún curso hasta que los asignes.
          </div>
          <Link href="/admin/seguimiento/asignar" style={{ color: "inherit", fontWeight: 650 }}>Asignarlos ahora →</Link>
        </div>
      )}

      {datos.alumnos.length === 0 ? (
        <div className="card" style={{ textAlign: "center" }}>
          <p className="lead">Todavía no hay alumnos registrados.</p>
        </div>
      ) : (
        <div className="stack-lg">
          {cursosConAlumnos.map(({ curso, alumnos }) => (
            <Grupo
              key={curso.id}
              titulo={nombreCurso(curso)}
              oculto={!curso.isActive}
              alumnos={alumnos}
              quizzes={datos.quizzes}
              onBorrar={borrarAlumno}
            />
          ))}

          {sinAsignar.length > 0 && (
            <Grupo titulo="Sin asignar" alumnos={sinAsignar} quizzes={datos.quizzes} onBorrar={borrarAlumno} mostrarTextoOriginal />
          )}
        </div>
      )}
    </main>
  );
}

// Un curso (o el grupo "Sin asignar"): promedio general, promedio por quiz y lista de alumnos
function Grupo({
  titulo,
  oculto,
  alumnos,
  quizzes,
  onBorrar,
  mostrarTextoOriginal,
}: {
  titulo: string;
  oculto?: boolean;
  alumnos: Alumno[];
  quizzes: { id: string; title: string }[];
  onBorrar: (id: string, nombre: string) => void;
  mostrarTextoOriginal?: boolean;
}) {
  // Promedio del curso = promedio de los alumnos que jugaron (los que no jugaron no cuentan como 0)
  const promCurso = promedio(alumnos.filter((a) => a.promedio !== null).map((a) => a.promedio!));

  const porQuiz = quizzes
    .map((q) => {
      const notas = alumnos.filter((a) => q.id in a.porQuiz).map((a) => a.porQuiz[q.id]);
      return { quiz: q, jugaron: notas.length, prom: promedio(notas) };
    })
    .filter((f) => f.jugaron > 0);

  return (
    <div className="stack-sm">
      <div className="card stack-sm" style={{ padding: "0.9rem 1.1rem" }}>
        <div style={{ fontWeight: 650, fontSize: "1.05rem", wordBreak: "break-word" }}>
          {titulo}
          {oculto && <span className="badge badge-muted" style={{ marginLeft: "0.5rem" }}>Oculto</span>}
        </div>
        <div className="muted">
          {alumnos.length} alumno(s) · promedio:{" "}
          {promCurso === null ? "—" : <b style={{ color: colorNota(promCurso) }}>{promCurso.toFixed(1)}</b>}
        </div>

        {porQuiz.length > 0 && (
          <div className="stack-sm" style={{ gap: "0.35rem", marginTop: "0.4rem" }}>
            {porQuiz.map(({ quiz, jugaron, prom }) => (
              <div key={quiz.id} className="row between" style={{ gap: "0.5rem", borderTop: "1px solid var(--border)", paddingTop: "0.35rem" }}>
                <span style={{ minWidth: 0, wordBreak: "break-word" }}>{quiz.title}</span>
                <span className="row" style={{ gap: "0.75rem", flexShrink: 0 }}>
                  <span className="muted">jugaron {jugaron} de {alumnos.length}</span>
                  <b style={{ color: colorNota(prom!) }}>{prom!.toFixed(1)}</b>
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="grid-1">
        {[...alumnos]
          .sort((a, b) => a.fullName.localeCompare(b.fullName))
          .map((a) => (
            <div key={a.id} className="card row between" style={{ padding: "0.9rem 1.1rem" }}>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontWeight: 600, wordBreak: "break-word" }}>{a.fullName}</div>
                {mostrarTextoOriginal && <div className="muted" style={{ wordBreak: "break-word" }}>Escribió: {a.textoOriginal}</div>}
                <div className="muted">Partidas jugadas: {a.cantPartidas}</div>
              </div>
              <div className="row" style={{ gap: "0.75rem", flexShrink: 0 }}>
                <span style={{ fontWeight: 700, color: a.promedio !== null ? colorNota(a.promedio) : "var(--text-muted)" }}>
                  {a.promedio !== null ? `${a.promedio.toFixed(1)} / 10` : "—"}
                </span>
                <button onClick={() => onBorrar(a.id, a.fullName)} className="btn btn-danger btn-sm">
                  Eliminar
                </button>
              </div>
            </div>
          ))}
      </div>
    </div>
  );
}
