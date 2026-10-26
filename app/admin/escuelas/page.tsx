"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, Plus, Notice } from "../../components/icons";

type Tipo = "modalidad" | "escuela" | "curso";
type Modalidad = { id: string; name: string; isActive: boolean };
type Escuela = Modalidad & { modalityId: string };
type Curso = Modalidad & { schoolId: string; cantAlumnos: number };
type Datos = { modalidades: Modalidad[]; escuelas: Escuela[]; cursos: Curso[] };

export default function Escuelas() {
  const [datos, setDatos] = useState<Datos | null>(null);
  const [mensaje, setMensaje] = useState("");

  function cargar() {
    fetch("/api/escuelas")
      .then((r) => r.json())
      .then((data) => setDatos(data));
  }

  useEffect(() => {
    cargar();
  }, []);

  // Manda el pedido a la API y recarga la lista. Devuelve true si salió bien.
  async function enviar(accion: "crear" | "editar" | "borrar", cuerpo: object) {
    const res = await fetch(`/api/escuelas/${accion}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(cuerpo),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setMensaje("✗ " + (data.error || "Hubo un error."));
      return false;
    }
    setMensaje("");
    cargar();
    return true;
  }

  async function borrar(tipo: Tipo, item: Modalidad) {
    if (!confirm(`¿Seguro que querés borrar "${item.name}"?`)) return;
    await enviar("borrar", { tipo, id: item.id });
  }

  return (
    <main className="page page-mid stack-lg animate-in" style={{ paddingTop: "clamp(1.5rem, 5vh, 3rem)" }}>
      <Link href="/admin" className="back-link"><ArrowLeft size={16} /> Volver al panel</Link>

      <header className="stack-sm">
        <h1 className="h1">Escuelas y cursos</h1>
        <p className="lead">
          Estas son las opciones que ven los alumnos al registrarse. Lo que ocultes deja de aparecer en el registro, pero no se borra.
        </p>
      </header>

      {mensaje && <Notice message={mensaje} success={false} />}

      <div className="card stack-sm">
        <div style={{ fontWeight: 650 }}>Nueva modalidad</div>
        <Agregar placeholder="Ej: Secundaria" onAgregar={(nombre) => enviar("crear", { tipo: "modalidad", nombre })} />
      </div>

      {!datos ? (
        <p className="lead">Cargando...</p>
      ) : datos.modalidades.length === 0 ? (
        <div className="card" style={{ textAlign: "center" }}>
          <p className="lead">Todavía no hay modalidades. Empezá creando una arriba.</p>
        </div>
      ) : (
        datos.modalidades.map((m) => {
          const escuelas = datos.escuelas.filter((e) => e.modalityId === m.id);
          return (
            <div key={m.id} className="card stack-md">
              <Elemento
                item={m}
                grande
                onGuardar={(cambios) => enviar("editar", { tipo: "modalidad", id: m.id, ...cambios })}
                onBorrar={() => borrar("modalidad", m)}
              />

              {escuelas.map((e) => {
                const cursos = datos.cursos.filter((c) => c.schoolId === e.id);
                return (
                  <div key={e.id} className="stack-sm" style={{ borderLeft: "3px solid var(--border)", paddingLeft: "0.9rem" }}>
                    <Elemento
                      item={e}
                      modalidades={datos.modalidades}
                      onGuardar={(cambios) => enviar("editar", { tipo: "escuela", id: e.id, ...cambios })}
                      onBorrar={() => borrar("escuela", e)}
                    />

                    <div className="stack-sm" style={{ paddingLeft: "0.9rem" }}>
                      {cursos.map((c) => (
                        <Elemento
                          key={c.id}
                          item={c}
                          detalle={`${c.cantAlumnos} alumno(s)`}
                          bloquearBorrar={c.cantAlumnos > 0 ? "Tiene alumnos asignados: ocultalo en lugar de borrarlo" : undefined}
                          onGuardar={(cambios) => enviar("editar", { tipo: "curso", id: c.id, ...cambios })}
                          onBorrar={() => borrar("curso", c)}
                        />
                      ))}
                      <Agregar
                        placeholder={`Nuevo curso en ${e.name} (ej: 1ro A)`}
                        onAgregar={(nombre) => enviar("crear", { tipo: "curso", nombre, padreId: e.id })}
                      />
                    </div>
                  </div>
                );
              })}

              <Agregar
                placeholder={`Nueva escuela de ${m.name}`}
                onAgregar={(nombre) => enviar("crear", { tipo: "escuela", nombre, padreId: m.id })}
              />
            </div>
          );
        })
      )}
    </main>
  );
}

// Campo de texto + botón "Agregar". Se vacía si se guardó bien.
function Agregar({ placeholder, onAgregar }: { placeholder: string; onAgregar: (nombre: string) => Promise<boolean> }) {
  const [nombre, setNombre] = useState("");
  const [guardando, setGuardando] = useState(false);

  async function agregar() {
    if (!nombre.trim()) return;
    setGuardando(true);
    const ok = await onAgregar(nombre);
    setGuardando(false);
    if (ok) setNombre("");
  }

  return (
    <div className="row" style={{ gap: "0.5rem", flexWrap: "nowrap" }}>
      <input
        className="input"
        value={nombre}
        onChange={(e) => setNombre(e.target.value)}
        onKeyDown={(e) => { if (e.key === "Enter") agregar(); }}
        placeholder={placeholder}
        style={{ minWidth: 0 }}
      />
      <button onClick={agregar} disabled={guardando || !nombre.trim()} className="btn btn-ghost btn-sm" style={{ flexShrink: 0 }}>
        <Plus size={15} /> Agregar
      </button>
    </div>
  );
}

type Cambios = { nombre?: string; activo?: boolean; modalidadId?: string };

// Una fila con el nombre y los botones Editar / Ocultar / Borrar
function Elemento({
  item,
  grande,
  detalle,
  modalidades,
  bloquearBorrar,
  onGuardar,
  onBorrar,
}: {
  item: Modalidad & { modalityId?: string };
  grande?: boolean;
  detalle?: string;
  modalidades?: Modalidad[]; // si viene, se puede cambiar la modalidad (solo escuelas)
  bloquearBorrar?: string;
  onGuardar: (cambios: Cambios) => Promise<boolean>;
  onBorrar: () => void;
}) {
  const [editando, setEditando] = useState(false);
  const [nombre, setNombre] = useState(item.name);
  const [modalidadId, setModalidadId] = useState(item.modalityId ?? "");

  async function guardar() {
    const ok = await onGuardar({ nombre, ...(modalidades ? { modalidadId } : {}) });
    if (ok) setEditando(false);
  }

  if (editando) {
    return (
      <div className="stack-sm">
        <input className="input" value={nombre} onChange={(e) => setNombre(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") guardar(); }} />
        {modalidades && (
          <select className="select" value={modalidadId} onChange={(e) => setModalidadId(e.target.value)}>
            {modalidades.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
          </select>
        )}
        <div className="row" style={{ gap: "0.5rem" }}>
          <button onClick={guardar} className="btn btn-primary btn-sm">Guardar</button>
          <button onClick={() => { setEditando(false); setNombre(item.name); setModalidadId(item.modalityId ?? ""); }} className="btn btn-ghost btn-sm">
            Cancelar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="row between" style={{ alignItems: "center", opacity: item.isActive ? 1 : 0.6 }}>
      <div style={{ minWidth: 0 }}>
        <span style={{ fontWeight: grande ? 700 : 600, fontSize: grande ? "1.15rem" : undefined, wordBreak: "break-word" }}>
          {item.name}
        </span>
        {!item.isActive && <span className="badge badge-muted" style={{ marginLeft: "0.5rem" }}>Oculta</span>}
        {detalle && <span className="muted" style={{ marginLeft: "0.5rem" }}>{detalle}</span>}
      </div>
      <div className="row" style={{ gap: "0.4rem" }}>
        <button onClick={() => setEditando(true)} className="btn btn-ghost btn-sm">Editar</button>
        <button onClick={() => onGuardar({ activo: !item.isActive })} className="btn btn-ghost btn-sm">
          {item.isActive ? "Ocultar" : "Mostrar"}
        </button>
        <button onClick={onBorrar} disabled={!!bloquearBorrar} title={bloquearBorrar} className="btn btn-danger btn-sm">
          Borrar
        </button>
      </div>
    </div>
  );
}
