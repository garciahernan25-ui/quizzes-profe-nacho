"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "../../../components/icons";
import { colorNota } from "../../seguimiento/tipos";

type Cambio = { studentId: string; nombre: string; curso: string | null; antes: number | null; despues: number | null };
type Recalculo = {
  respuestasQueCambian: number;
  cambian: Cambio[];
  editadas: (Cambio & { notaEditada: number })[];
  viejas: { studentId: string; nombre: string; curso: string | null; nota: number }[];
};

function Nota({ n }: { n: number | null }) {
  return <b style={{ color: n !== null ? colorNota(n) : "var(--text-muted)" }}>{n !== null ? n.toFixed(1) : "—"}</b>;
}

// Recalcula las notas de un quiz ya jugado con las respuestas correctas de hoy.
// Primero muestra qué cambiaría; recién al tocar "Aplicar" se guarda.
export default function Recalcular() {
  const params = useParams();
  const quizId = params.quizId as string;
  const [titulo, setTitulo] = useState("");
  const [vista, setVista] = useState<Recalculo | null>(null);
  const [error, setError] = useState("");
  const [aplicando, setAplicando] = useState(false);
  const [listo, setListo] = useState("");

  function cargar() {
    fetch(`/api/notas/recalcular?quizId=${encodeURIComponent(quizId)}`, { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then(setVista)
      .catch(() => setError("No se pudo calcular. Probá de nuevo."));
  }

  useEffect(() => {
    cargar();
    fetch("/api/quizzes/lista")
      .then((r) => r.json())
      .then((data: { id: string; title: string }[]) => setTitulo(data.find((q) => q.id === quizId)?.title ?? ""));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quizId]);

  async function aplicar() {
    if (!vista) return;
    const texto =
      `¿Recalcular las notas de "${titulo}"?\n\n` +
      `Cambia la nota de ${vista.cambian.length} alumno(s).` +
      (vista.editadas.length > 0 ? `\nLas ${vista.editadas.length} nota(s) editadas a mano NO se tocan.` : "") +
      (vista.viejas.length > 0 ? `\nLas notas del sistema anterior NO se pueden recalcular.` : "");
    if (!confirm(texto)) return;
    setAplicando(true);
    const res = await fetch("/api/notas/recalcular", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ quizId }),
    });
    setAplicando(false);
    if (res.ok) {
      setListo(`✓ Listo: se recalcularon las notas de ${vista.cambian.length} alumno(s).`);
      cargar();
    } else {
      alert("Hubo un error. No se cambió nada, probá de nuevo.");
    }
  }

  return (
    <main className="page page-mid stack-lg animate-in" style={{ paddingTop: "clamp(1.5rem, 5vh, 3rem)" }}>
      <Link href={`/admin/quiz/${quizId}`} className="back-link"><ArrowLeft size={16} /> Volver al quiz</Link>
      <header className="stack-sm">
        <span className="eyebrow">Recalcular notas</span>
        <h1 className="h1" style={{ wordBreak: "break-word" }}>{titulo || "Quiz"}</h1>
        <p className="lead">
          Se comparan las respuestas que eligió cada alumno con la respuesta correcta que tiene cada pregunta hoy.
          Una respuesta que llegó fuera de tiempo sigue sin valer.
        </p>
      </header>

      {listo && <div className="notice notice-success">{listo}</div>}
      {error && <div className="notice notice-error">{error}</div>}

      {!vista ? (
        !error && <p className="lead">Calculando...</p>
      ) : (
        <>
          {vista.respuestasQueCambian === 0 ? (
            <div className="card" style={{ textAlign: "center" }}>
              <p className="lead">No hay nada para recalcular: todas las notas coinciden con las respuestas correctas de hoy.</p>
            </div>
          ) : (
            <div className="card stack-md">
              <div>
                <b>{vista.cambian.length}</b> alumno(s) cambian de nota · {vista.respuestasQueCambian} respuesta(s) cambian de bien a mal o al revés.
              </div>
              <button className="btn btn-primary" style={{ alignSelf: "flex-start" }} disabled={aplicando} onClick={aplicar}>
                {aplicando ? "Aplicando..." : "Aplicar recálculo"}
              </button>
            </div>
          )}

          {vista.cambian.length > 0 && (
            <Grupo titulo="Cambian de nota">
              {vista.cambian.map((c) => (
                <Fila key={c.studentId} c={c}>
                  <Nota n={c.antes} /> → <Nota n={c.despues} />
                </Fila>
              ))}
            </Grupo>
          )}

          {vista.editadas.length > 0 && (
            <Grupo titulo="Editadas a mano: no se cambian" texto="Sigue valiendo la nota que pusiste vos. Si querés ajustarla, hacelo desde la ficha del alumno.">
              {vista.editadas.map((c) => (
                <Fila key={c.studentId} c={c}>
                  <span className="muted">vale </span><Nota n={c.notaEditada} />
                  <span className="muted"> · recalculada sacaría </span><Nota n={c.despues} />
                </Fila>
              ))}
            </Grupo>
          )}

          {vista.viejas.length > 0 && (
            <Grupo
              titulo="Quedan afuera: notas del sistema anterior"
              texto="Antes no se guardaba qué respondió cada alumno, así que estas notas no se pueden recalcular. Si hace falta, editalas a mano desde la ficha."
            >
              {vista.viejas.map((v) => (
                <Fila key={v.studentId} c={v}>
                  <Nota n={v.nota} />
                </Fila>
              ))}
            </Grupo>
          )}
        </>
      )}
    </main>
  );
}

function Grupo({ titulo, texto, children }: { titulo: string; texto?: string; children: React.ReactNode }) {
  return (
    <section className="stack-sm">
      <h2 className="h2">{titulo}</h2>
      {texto && <p className="muted">{texto}</p>}
      <div className="grid-1">{children}</div>
    </section>
  );
}

function Fila({ c, children }: { c: { studentId: string; nombre: string; curso: string | null }; children: React.ReactNode }) {
  return (
    <div className="card row between" style={{ padding: "0.7rem 1rem", gap: "0.5rem" }}>
      <div style={{ minWidth: 0 }}>
        <Link href={`/admin/seguimiento/alumno/${c.studentId}`} style={{ fontWeight: 600, color: "inherit", wordBreak: "break-word" }}>{c.nombre}</Link>
        <div className="muted">{c.curso ?? "Sin curso"}</div>
      </div>
      <div style={{ flexShrink: 0 }}>{children}</div>
    </div>
  );
}
