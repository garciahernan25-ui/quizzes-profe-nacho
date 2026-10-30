"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft } from "../../components/icons";

type Pendiente = {
  id: string;
  fullName: string;
  username: string;
  courseId: string | null;
  curso: string | null;
  escuela: string | null;
  modalidad: string | null;
  escuelaEscrita: string;
  createdAt: number | null;
};

// Cada cuántos milisegundos se pide la lista de nuevo (en clase se registran varios a la vez)
const CADA_MS = 5000;

function fecha(ms: number | null) {
  if (!ms) return "—";
  return new Date(ms).toLocaleString("es-AR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

function nombreCurso(p: Pendiente) {
  return p.curso ? `${p.modalidad} · ${p.escuela} · ${p.curso}` : `Sin curso (escribió: ${p.escuelaEscrita})`;
}

export default function Pendientes() {
  const [lista, setLista] = useState<Pendiente[] | null>(null);
  const [cursoElegido, setCursoElegido] = useState("");
  const [editando, setEditando] = useState<{ id: string; nombre: string } | null>(null);
  const [ocupado, setOcupado] = useState("");
  const [mensaje, setMensaje] = useState("");

  async function cargar() {
    try {
      const res = await fetch("/api/alumnos/pendientes", { cache: "no-store" });
      if (res.ok) setLista(await res.json());
    } catch {
      // Sin conexión: se reintenta en el próximo turno
    }
  }

  useEffect(() => {
    // Primera carga apenas se abre la pantalla, después cada 5 segundos
    const primera = setTimeout(cargar, 0);
    const t = setInterval(() => {
      if (!document.hidden) cargar();
    }, CADA_MS);
    return () => {
      clearTimeout(primera);
      clearInterval(t);
    };
  }, []);

  async function enviar(url: string, datos: object, clave: string) {
    setOcupado(clave);
    setMensaje("");
    const res = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(datos) });
    const data = await res.json().catch(() => ({}));
    setOcupado("");
    if (!res.ok) alert(data.error || "Hubo un error. Probá de nuevo.");
    await cargar();
    return data;
  }

  async function aprobar(p: Pendiente, nombre?: string) {
    await enviar("/api/alumnos/aprobar", nombre === undefined ? { id: p.id } : { id: p.id, fullName: nombre }, p.id);
    setEditando(null);
  }

  async function rechazar(p: Pendiente) {
    if (!confirm(`¿Rechazar a "${p.fullName}"?\n\nSe borra su registro. Puede volver a registrarse con su nombre real (y vas a tener que aprobarlo de nuevo).`)) return;
    await enviar("/api/alumnos/rechazar", { id: p.id }, p.id);
  }

  async function aprobarTodos(courseId: string, cantidad: number, nombre: string) {
    if (!confirm(`¿Aprobar a los ${cantidad} pendientes de ${nombre}?\n\nRevisá antes que no haya nombres raros.`)) return;
    const data = await enviar("/api/alumnos/aprobar-curso", { courseId }, "todos");
    if (data.ok) setMensaje(`✓ Se aprobaron ${data.aprobados} alumno(s).`);
  }

  // Cursos que tienen pendientes, para el filtro
  const cursos = new Map<string, { nombre: string; cantidad: number }>();
  for (const p of lista ?? []) {
    if (!p.courseId) continue;
    const c = cursos.get(p.courseId);
    cursos.set(p.courseId, { nombre: nombreCurso(p), cantidad: (c?.cantidad ?? 0) + 1 });
  }
  const ordenados = [...cursos].sort((a, b) => a[1].nombre.localeCompare(b[1].nombre, "es", { numeric: true }));
  const filtro = cursoElegido && cursos.has(cursoElegido) ? cursoElegido : "";
  const visibles = (lista ?? []).filter((p) => !filtro || p.courseId === filtro);

  return (
    <main className="page page-mid stack-lg animate-in" style={{ paddingTop: "clamp(1.5rem, 5vh, 3rem)" }}>
      <Link href="/admin" className="back-link"><ArrowLeft size={16} /> Volver al panel</Link>
      <header className="stack-sm">
        <span className="eyebrow">Alumnos</span>
        <h1 className="h1">Alumnos pendientes</h1>
        <p className="lead">Los que se registraron y esperan que los apruebes. Hasta que no los aprobás, no pueden hacer ningún quiz.</p>
      </header>

      {mensaje && <div className="notice notice-success">{mensaje}</div>}

      {lista === null ? (
        <p className="lead">Cargando...</p>
      ) : lista.length === 0 ? (
        <div className="card" style={{ textAlign: "center" }}>
          <p className="lead">No hay alumnos pendientes. Esta lista se actualiza sola.</p>
        </div>
      ) : (
        <>
          <div className="card row" style={{ gap: "0.75rem" }}>
            <select className="select" style={{ flex: "1 1 16rem" }} value={filtro} onChange={(e) => setCursoElegido(e.target.value)}>
              <option value="">Todos los cursos ({lista.length})</option>
              {ordenados.map(([id, c]) => (
                <option key={id} value={id}>{`${c.nombre} (${c.cantidad})`}</option>
              ))}
            </select>
            {filtro && (
              <button
                className="btn btn-success"
                disabled={ocupado === "todos"}
                onClick={() => aprobarTodos(filtro, cursos.get(filtro)!.cantidad, cursos.get(filtro)!.nombre)}
              >
                Aprobar todos ({cursos.get(filtro)!.cantidad})
              </button>
            )}
            {!filtro && <span className="muted">Elegí un curso para aprobarlos a todos juntos.</span>}
          </div>

          <div className="grid-1">
            {visibles.map((p) => (
              <div key={p.id} className="card stack-sm" style={{ padding: "0.9rem 1.1rem" }}>
                {editando?.id === p.id ? (
                  <div className="row" style={{ gap: "0.5rem" }}>
                    <input
                      className="input"
                      style={{ flex: "1 1 14rem" }}
                      value={editando.nombre}
                      maxLength={80}
                      autoFocus
                      onChange={(e) => setEditando({ id: p.id, nombre: e.target.value })}
                      onKeyDown={(e) => e.key === "Enter" && aprobar(p, editando.nombre)}
                    />
                    <button className="btn btn-success btn-sm" disabled={ocupado === p.id || !editando.nombre.trim()} onClick={() => aprobar(p, editando.nombre)}>
                      Guardar y aprobar
                    </button>
                    <button className="btn btn-ghost btn-sm" onClick={() => setEditando(null)}>Cancelar</button>
                  </div>
                ) : (
                  <div style={{ fontWeight: 650, fontSize: "1.05rem", wordBreak: "break-word" }}>{p.fullName}</div>
                )}
                <div className="muted" style={{ wordBreak: "break-word" }}>
                  Usuario: {p.username} · {nombreCurso(p)} · se registró el {fecha(p.createdAt)}
                </div>
                {editando?.id !== p.id && (
                  <div className="row" style={{ gap: "0.5rem" }}>
                    <button className="btn btn-success btn-sm" disabled={ocupado === p.id} onClick={() => aprobar(p)}>Aprobar</button>
                    <button className="btn btn-ghost btn-sm" disabled={ocupado === p.id} onClick={() => setEditando({ id: p.id, nombre: p.fullName })}>
                      Editar nombre y aprobar
                    </button>
                    <button className="btn btn-danger btn-sm" disabled={ocupado === p.id} onClick={() => rechazar(p)}>Rechazar</button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </>
      )}
    </main>
  );
}
