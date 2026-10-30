"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "../../../../components/icons";
import { colorNota } from "../../tipos";
import { leerNota } from "../../../../../lib/notas";

type IntentoFicha = {
  id: string;
  numero: number;
  enCurso: boolean;
  nota: number | null;
  correctas: number;
  respondidas: number;
  puntos: number;
  empezo: number;
  duracionMs: number | null;
};

type QuizFicha = {
  quizId: string;
  titulo: string;
  nota: number | null;
  notaCalculada: number | null;
  editada: { nota: number; fecha: number; por: string } | null;
  cambios: { id: string; nota: number | null; anterior: number | null; fecha: number; por: string }[];
  tieneIntentoDisponible: boolean;
  anterior: { nota: number; fecha: number | null } | null;
  intentos: IntentoFicha[];
};

type Ficha = {
  alumno: {
    id: string;
    fullName: string;
    username: string;
    status: "pendiente" | "aprobado" | "bloqueado";
    curso: string | null;
    escuela: string | null;
    modalidad: string | null;
  };
  quizzes: QuizFicha[];
};

const nota1 = (n: number | null) => (n !== null ? n.toFixed(1) : "sin nota");

function fecha(ms: number | null) {
  if (!ms) return "—";
  return new Date(ms).toLocaleString("es-AR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

function duracion(ms: number | null) {
  if (ms === null) return "—";
  const seg = Math.round(ms / 1000);
  return seg < 60 ? `${seg} s` : `${Math.floor(seg / 60)} min ${seg % 60} s`;
}

export default function FichaAlumno() {
  const params = useParams();
  const id = params.id as string;
  const [ficha, setFicha] = useState<Ficha | null>(null);
  const [error, setError] = useState("");
  const [ocupado, setOcupado] = useState("");

  function cargar() {
    fetch(`/api/alumnos/ficha?id=${encodeURIComponent(id)}`)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((data) => setFicha(data))
      .catch(() => setError("No se pudo cargar la ficha del alumno."));
  }

  useEffect(() => {
    cargar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function enviar(url: string, datos: object, clave: string) {
    setOcupado(clave);
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(datos),
    });
    setOcupado("");
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      alert(data.error || "Hubo un error. Probá de nuevo.");
    }
    cargar();
  }

  async function accion(url: string, q: QuizFicha, pregunta: string) {
    if (!ficha || !confirm(pregunta)) return;
    await enviar(url, { studentId: ficha.alumno.id, quizId: q.quizId }, q.quizId);
  }

  async function editarNota(q: QuizFicha) {
    if (!ficha) return;
    const texto = prompt(`Nota nueva de "${q.titulo}" para ${ficha.alumno.fullName} (de 0 a 10, por ejemplo 7,5):`, q.nota !== null ? q.nota.toFixed(1) : "");
    if (texto === null) return;
    const nota = leerNota(texto);
    if (nota === null) {
      alert("La nota tiene que ser un número de 0 a 10.");
      return;
    }
    const aviso = q.intentos.length > 0 ? "\n\nEsta nota va a mandar aunque después haga otro intento. La podés quitar cuando quieras." : "";
    if (!confirm(`¿Cambiar la nota de "${q.titulo}" de ${nota1(q.nota)} a ${nota.toFixed(1)}?${aviso}`)) return;
    await enviar("/api/notas/editar", { studentId: ficha.alumno.id, quizId: q.quizId, nota: String(nota) }, q.quizId);
  }

  async function cambiarNombre() {
    if (!ficha) return;
    const nombre = prompt("Nombre nuevo:", ficha.alumno.fullName);
    if (nombre === null || nombre.trim() === ficha.alumno.fullName) return;
    if (!confirm(`¿Cambiar el nombre de "${ficha.alumno.fullName}" a "${nombre.trim()}"?\n\nSus notas no cambian.`)) return;
    await enviar("/api/alumnos/nombre", { id: ficha.alumno.id, fullName: nombre }, "alumno");
  }

  async function bloquear(bloqueado: boolean) {
    if (!ficha) return;
    const pregunta = bloqueado
      ? `¿Bloquear a ${ficha.alumno.fullName}?\n\nNo va a poder hacer quizzes ni va a aparecer en el ranking. Sus notas se conservan y lo podés desbloquear cuando quieras.`
      : `¿Desbloquear a ${ficha.alumno.fullName}?`;
    if (!confirm(pregunta)) return;
    await enviar("/api/alumnos/bloquear", { id: ficha.alumno.id, bloqueado }, "alumno");
  }

  if (error) {
    return (
      <main className="page page-mid stack-lg animate-in" style={{ paddingTop: "clamp(1.5rem, 5vh, 3rem)" }}>
        <Link href="/admin/seguimiento" className="back-link"><ArrowLeft size={16} /> Volver al seguimiento</Link>
        <div className="notice notice-error">{error}</div>
      </main>
    );
  }

  if (!ficha) {
    return (
      <main className="page page-mid stack-lg animate-in" style={{ paddingTop: "clamp(1.5rem, 5vh, 3rem)" }}>
        <p className="lead">Cargando...</p>
      </main>
    );
  }

  const { alumno } = ficha;
  const curso = alumno.curso ? `${alumno.modalidad} · ${alumno.escuela} · ${alumno.curso}` : "Sin curso asignado";

  return (
    <main className="page page-mid stack-lg animate-in" style={{ paddingTop: "clamp(1.5rem, 5vh, 3rem)" }}>
      <Link href="/admin/seguimiento" className="back-link"><ArrowLeft size={16} /> Volver al seguimiento</Link>
      <header className="stack-sm">
        <h1 className="h1" style={{ wordBreak: "break-word" }}>
          {alumno.fullName}
          {alumno.status === "bloqueado" && <span className="badge" style={{ marginLeft: "0.6rem", color: "var(--danger)", borderColor: "var(--danger-border)", verticalAlign: "middle" }}>Bloqueado</span>}
          {alumno.status === "pendiente" && <span className="badge" style={{ marginLeft: "0.6rem", color: "var(--warning)", verticalAlign: "middle" }}>Pendiente</span>}
        </h1>
        <p className="muted" style={{ wordBreak: "break-word" }}>Usuario: {alumno.username} · {curso}</p>
        <div className="row" style={{ gap: "0.5rem" }}>
          <button className="btn btn-ghost btn-sm" disabled={ocupado === "alumno"} onClick={cambiarNombre}>Cambiar nombre</button>
          {alumno.status === "aprobado" && (
            <button className="btn btn-danger btn-sm" disabled={ocupado === "alumno"} onClick={() => bloquear(true)}>Bloquear</button>
          )}
          {alumno.status === "bloqueado" && (
            <button className="btn btn-success btn-sm" disabled={ocupado === "alumno"} onClick={() => bloquear(false)}>Desbloquear</button>
          )}
          {alumno.status === "pendiente" && (
            <Link href="/admin/pendientes" className="btn btn-primary btn-sm">Ir a aprobarlo</Link>
          )}
        </div>
      </header>

      {ficha.quizzes.length === 0 ? (
        <div className="card" style={{ textAlign: "center" }}>
          <p className="lead">Todavía no hizo ningún quiz.</p>
        </div>
      ) : (
        <div className="grid-1">
          {ficha.quizzes.map((q) => {
            // La que cuenta es la editada a mano, o si no la mejor; si hay dos iguales, marcamos solo la primera
            const cuenta = q.editada
              ? "editada"
              : q.anterior && q.anterior.nota === q.nota
                ? "anterior"
                : q.intentos.find((i) => i.nota !== null && i.nota === q.nota)?.id;
            return (
            <div key={q.quizId} className="card stack-sm" style={{ padding: "0.9rem 1.1rem" }}>
              <div className="row between" style={{ alignItems: "flex-start" }}>
                <div style={{ fontWeight: 650, fontSize: "1.05rem", minWidth: 0, wordBreak: "break-word" }}>{q.titulo}</div>
                <span style={{ fontWeight: 700, flexShrink: 0, color: q.nota !== null ? colorNota(q.nota) : "var(--text-muted)" }}>
                  {q.editada && <span title="Editada a mano">✎ </span>}
                  {q.nota !== null ? `${q.nota.toFixed(1)} / 10` : "—"}
                </span>
              </div>

              <div className="stack-sm" style={{ gap: "0.35rem" }}>
                {q.editada && (
                  <Linea
                    titulo="Editada a mano"
                    detalle={`${fecha(q.editada.fecha)} · por ${q.editada.por} · la de los intentos es ${nota1(q.notaCalculada)}`}
                    nota={q.editada.nota}
                    mejor={cuenta === "editada"}
                  />
                )}
                {q.anterior && (
                  <Linea titulo="Sistema anterior" detalle={`${fecha(q.anterior.fecha)} · sin puntos ni duración`} nota={q.anterior.nota} mejor={cuenta === "anterior"} />
                )}
                {q.intentos.map((i) => (
                  <Linea
                    key={i.id}
                    titulo={`Intento ${i.numero}`}
                    detalle={
                      i.enCurso
                        ? `${fecha(i.empezo)} · en curso (${i.respondidas} respondidas)`
                        : `${fecha(i.empezo)} · tardó ${duracion(i.duracionMs)} · ${i.correctas} de ${i.respondidas} bien · ${i.puntos} puntos`
                    }
                    nota={i.nota}
                    mejor={cuenta === i.id}
                  />
                ))}
              </div>

              <div className="row" style={{ gap: "0.5rem", marginTop: "0.25rem" }}>
                {q.tieneIntentoDisponible ? (
                  <span className="badge badge-success">Tiene un intento disponible</span>
                ) : (
                  <button
                    className="btn btn-ghost btn-sm"
                    disabled={ocupado === q.quizId}
                    onClick={() =>
                      accion(
                        "/api/intentos/habilitar",
                        q,
                        `¿Habilitar otro intento de "${q.titulo}" para ${alumno.fullName}?\n\n` +
                          (q.editada
                            ? "Ojo: la nota está editada a mano y va a seguir mandando. Si querés que cuente la del intento nuevo, tocá \"Quitar edición\"."
                            : "Sus notas anteriores se conservan y cuenta la mejor.")
                      )
                    }
                  >
                    Habilitar otro intento
                  </button>
                )}
                <button className="btn btn-ghost btn-sm" disabled={ocupado === q.quizId} onClick={() => editarNota(q)}>
                  Editar nota
                </button>
                {q.editada && (
                  <button
                    className="btn btn-ghost btn-sm"
                    disabled={ocupado === q.quizId}
                    onClick={() =>
                      accion(
                        "/api/notas/quitar-edicion",
                        q,
                        `¿Quitar la nota editada a mano (${q.editada!.nota.toFixed(1)})?\n\nVuelve a contar la de los intentos: ${nota1(q.notaCalculada)}.`
                      )
                    }
                  >
                    Quitar edición
                  </button>
                )}
                <button
                  className="btn btn-danger btn-sm"
                  disabled={ocupado === q.quizId}
                  onClick={() =>
                    accion(
                      "/api/intentos/borrar",
                      q,
                      `¿Borrar TODAS las notas de "${q.titulo}" de ${alumno.fullName}?\n\nNo se puede deshacer. Después va a poder hacer el quiz de nuevo.`
                    )
                  }
                >
                  Borrar nota
                </button>
              </div>

              {q.cambios.length > 0 && (
                <details className="muted">
                  <summary style={{ cursor: "pointer" }}>Registro de cambios a mano ({q.cambios.length})</summary>
                  <ul style={{ margin: "0.4rem 0 0", paddingLeft: "1.2rem" }}>
                    {[...q.cambios].reverse().map((c) => (
                      <li key={c.id}>
                        {fecha(c.fecha)} · {c.por}:{" "}
                        {c.nota !== null ? `de ${nota1(c.anterior)} a ${c.nota.toFixed(1)}` : `quitó la edición (era ${nota1(c.anterior)})`}
                      </li>
                    ))}
                  </ul>
                </details>
              )}
            </div>
            );
          })}
        </div>
      )}
    </main>
  );
}

function Linea({ titulo, detalle, nota, mejor }: { titulo: string; detalle: string; nota: number | null; mejor: boolean }) {
  return (
    <div className="row between" style={{ gap: "0.5rem", borderTop: "1px solid var(--border)", paddingTop: "0.35rem" }}>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontWeight: 600 }}>
          {titulo}
          {mejor && <span className="badge badge-success" style={{ marginLeft: "0.5rem" }}>Cuenta esta</span>}
        </div>
        <div className="muted" style={{ wordBreak: "break-word" }}>{detalle}</div>
      </div>
      <b style={{ flexShrink: 0, color: nota !== null ? colorNota(nota) : "var(--text-muted)" }}>{nota !== null ? nota.toFixed(1) : "—"}</b>
    </div>
  );
}
