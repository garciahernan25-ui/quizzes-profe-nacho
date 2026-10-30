"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, Notice } from "../../../components/icons";
import { normalizar } from "../../../../lib/texto";
import { type Alumno, type DatosSeguimiento, nombreCurso } from "../tipos";

const SIN_CURSO = "__sin_curso";

export default function Asignar() {
  const [datos, setDatos] = useState<DatosSeguimiento | null>(null);
  const [soloSinAsignar, setSoloSinAsignar] = useState(true);
  const [elegidos, setElegidos] = useState<string[]>([]);
  const [destino, setDestino] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [guardando, setGuardando] = useState(false);

  function cargar() {
    fetch("/api/seguimiento")
      .then((r) => r.json())
      .then((data) => setDatos(data));
  }

  useEffect(() => {
    cargar();
  }, []);

  if (!datos) {
    return (
      <main className="page page-mid stack-lg animate-in" style={{ paddingTop: "clamp(1.5rem, 5vh, 3rem)" }}>
        <p className="lead">Cargando...</p>
      </main>
    );
  }

  const cursoPorId = new Map(datos.cursos.map((c) => [c.id, c]));
  const visibles = datos.alumnos.filter((a) => !soloSinAsignar || !a.courseId);

  // Agrupar por lo que escribieron (sin importar mayúsculas, tildes ni espacios)
  const grupos = new Map<string, { titulo: string; alumnos: Alumno[] }>();
  for (const a of visibles) {
    const clave = normalizar(a.textoOriginal);
    if (!grupos.has(clave)) grupos.set(clave, { titulo: a.textoOriginal || "(sin datos)", alumnos: [] });
    grupos.get(clave)!.alumnos.push(a);
  }
  const listaGrupos = [...grupos.entries()].sort(([a], [b]) => a.localeCompare(b, "es", { numeric: true }));

  // Cursos agrupados por "Modalidad · Escuela" para la lista desplegable
  const escuelas = new Map<string, typeof datos.cursos>();
  for (const c of datos.cursos) {
    const clave = `${c.modalidad} · ${c.escuela}`;
    if (!escuelas.has(clave)) escuelas.set(clave, []);
    escuelas.get(clave)!.push(c);
  }

  function alternar(ids: string[], marcar: boolean) {
    setElegidos((prev) => (marcar ? [...new Set([...prev, ...ids])] : prev.filter((id) => !ids.includes(id))));
  }

  async function asignar() {
    if (elegidos.length === 0 || !destino) return;
    const courseId = destino === SIN_CURSO ? null : destino;
    const texto = courseId ? nombreCurso(cursoPorId.get(courseId)!) : "Sin asignar";
    if (!confirm(`¿Pasar ${elegidos.length} alumno(s) a "${texto}"?`)) return;

    setGuardando(true);
    const res = await fetch("/api/estudiantes/asignar", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids: elegidos, courseId }),
    });
    const data = await res.json().catch(() => ({}));
    setGuardando(false);
    if (res.ok) {
      setMensaje(`✓ ${data.cambiados} alumno(s) pasados a "${texto}". Sus notas no cambiaron.`);
      setElegidos([]);
      cargar();
    } else {
      setMensaje("✗ " + (data.error || "No se pudo asignar."));
    }
  }

  return (
    <main className="page page-mid stack-lg animate-in" style={{ paddingTop: "clamp(1.5rem, 5vh, 3rem)", paddingBottom: "8rem" }}>
      <Link href="/admin/seguimiento" className="back-link"><ArrowLeft size={16} /> Volver al seguimiento</Link>

      <header className="stack-sm">
        <h1 className="h1">Asignar alumnos a cursos</h1>
        <p className="lead">
          Marcá los alumnos, elegí el curso y tocá Asignar. Las notas de cada alumno no se tocan: pasan a contar para el curso nuevo.
        </p>
      </header>

      {datos.cursos.length === 0 && (
        <p className="notice notice-error">
          Todavía no hay cursos. Crealos primero en <Link href="/admin/escuelas" style={{ color: "inherit", fontWeight: 650 }}>Escuelas y cursos</Link>.
        </p>
      )}

      <label className="row" style={{ gap: "0.5rem", cursor: "pointer" }}>
        <input type="checkbox" checked={soloSinAsignar} onChange={(e) => { setSoloSinAsignar(e.target.checked); setElegidos([]); }} />
        Mostrar solo los que no tienen curso
      </label>

      {mensaje && <Notice message={mensaje} success={mensaje.startsWith("✓")} />}

      {visibles.length === 0 ? (
        <div className="card" style={{ textAlign: "center" }}>
          <p className="lead">{soloSinAsignar ? "¡Todos los alumnos tienen curso!" : "Todavía no hay alumnos registrados."}</p>
        </div>
      ) : (
        listaGrupos.map(([clave, grupo]) => {
          const ids = grupo.alumnos.map((a) => a.id);
          const todos = ids.every((id) => elegidos.includes(id));
          return (
            <div key={clave} className="card stack-sm">
              <label className="row" style={{ gap: "0.6rem", cursor: "pointer", alignItems: "flex-start" }}>
                <input type="checkbox" checked={todos} onChange={(e) => alternar(ids, e.target.checked)} style={{ marginTop: "0.3rem" }} />
                <span>
                  <span className="muted">Escribieron: </span>
                  <b style={{ wordBreak: "break-word" }}>{grupo.titulo}</b>
                  <span className="muted"> ({grupo.alumnos.length})</span>
                </span>
              </label>

              <div className="stack-sm" style={{ paddingLeft: "1.6rem" }}>
                {grupo.alumnos
                  .sort((a, b) => a.fullName.localeCompare(b.fullName))
                  .map((a) => {
                    const curso = a.courseId ? cursoPorId.get(a.courseId) : undefined;
                    return (
                      <label key={a.id} className="row" style={{ gap: "0.6rem", cursor: "pointer", alignItems: "flex-start" }}>
                        <input type="checkbox" checked={elegidos.includes(a.id)} onChange={(e) => alternar([a.id], e.target.checked)} style={{ marginTop: "0.3rem" }} />
                        <span style={{ minWidth: 0 }}>
                          <span style={{ fontWeight: 600, wordBreak: "break-word" }}>{a.fullName}</span>
                          <span className="muted"> · {a.username} · {a.cantQuizzes} quiz(zes) hecho(s)</span>
                          <br />
                          <span className={`badge ${curso ? "" : "badge-muted"}`}>{curso ? nombreCurso(curso) : "Sin asignar"}</span>
                        </span>
                      </label>
                    );
                  })}
              </div>
            </div>
          );
        })
      )}

      {/* Barra fija abajo: elegir curso y asignar */}
      <div className="card row" style={{ position: "fixed", bottom: "1rem", left: "50%", transform: "translateX(-50%)", width: "min(calc(100% - 2rem), 760px)", gap: "0.5rem", boxShadow: "var(--shadow-lg)", zIndex: 10 }}>
        <select className="select" value={destino} onChange={(e) => setDestino(e.target.value)} style={{ flex: "1 1 220px", minWidth: 0 }}>
          <option value="">Elegí el curso...</option>
          {[...escuelas.entries()].map(([escuela, cursos]) => (
            <optgroup key={escuela} label={escuela}>
              {cursos.map((c) => (
                <option key={c.id} value={c.id}>{c.name}{c.isActive ? "" : " (oculto)"}</option>
              ))}
            </optgroup>
          ))}
          <option value={SIN_CURSO}>— Sacarles el curso (sin asignar) —</option>
        </select>
        <button onClick={asignar} disabled={guardando || elegidos.length === 0 || !destino} className="btn btn-primary" style={{ flexShrink: 0 }}>
          {guardando ? "Asignando..." : `Asignar (${elegidos.length})`}
        </button>
      </div>
    </main>
  );
}
