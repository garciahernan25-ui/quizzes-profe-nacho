"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft } from "../../components/icons";
import { cantidadTerminados, podioAutomatico, primerosTres } from "../../../lib/podio";
import Podio from "./Podio";

type Quiz = { id: string; title: string };
type Curso = { id: string; name: string; escuela: string; modalidad: string; habilitado: boolean };
type Fila = { id: string; nombre: string; empezo: boolean; terminado: boolean; puntos: number; respondidas: number };
type Tabla = { totalPreguntas: number; filas: Fila[] };

// Cada cuántos milisegundos se pide la tabla de nuevo
const CADA_MS = 3000;

export default function Ranking() {
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [cursos, setCursos] = useState<Curso[]>([]);
  const [quizId, setQuizId] = useState("");
  const [courseId, setCourseId] = useState("");
  const [tabla, setTabla] = useState<Tabla | null>(null);
  const [sinConexion, setSinConexion] = useState(false);
  // Podio: el profe lo puede largar a mano. Al volver a la tabla se anota cuántos habían terminado,
  // para que no vuelva a salir solo hasta que termine alguien más.
  const [podioAMano, setPodioAMano] = useState(false);
  const [cerradoCon, setCerradoCon] = useState<number | null>(null);

  function reiniciarPodio() {
    setPodioAMano(false);
    setCerradoCon(null);
  }

  useEffect(() => {
    fetch("/api/quizzes/lista")
      .then((r) => r.json())
      .then((data: Quiz[]) => setQuizzes(data.sort((a, b) => a.title.localeCompare(b.title, "es", { numeric: true }))));
  }, []);

  // Al elegir el quiz, solo se muestran los cursos que lo tienen habilitado
  function elegirQuiz(id: string) {
    setQuizId(id);
    setCursos([]);
    setCourseId("");
    setTabla(null);
    reiniciarPodio();
  }

  useEffect(() => {
    if (!quizId) return;
    fetch(`/api/quizzes/acceso?quizId=${encodeURIComponent(quizId)}`)
      .then((r) => r.json())
      .then((data) => setCursos((data.cursos as Curso[]).filter((c) => c.habilitado)));
  }, [quizId]);

  // Consulta la tabla cada 3 segundos (y deja de consultar si la pestaña no está a la vista)
  useEffect(() => {
    if (!quizId || !courseId) return;
    let cancelado = false;
    async function pedir() {
      if (document.hidden) return;
      try {
        const res = await fetch(`/api/ranking?quizId=${encodeURIComponent(quizId)}&courseId=${encodeURIComponent(courseId)}`, { cache: "no-store" });
        if (!res.ok) throw new Error();
        const data = await res.json();
        if (!cancelado) {
          setTabla(data);
          setSinConexion(false);
        }
      } catch {
        if (!cancelado) setSinConexion(true);
      }
    }
    pedir();
    const t = setInterval(pedir, CADA_MS);
    return () => {
      cancelado = true;
      clearInterval(t);
    };
  }, [quizId, courseId]);

  const quiz = quizzes.find((q) => q.id === quizId);
  const curso = cursos.find((c) => c.id === courseId);
  const medallas = ["🥇", "🥈", "🥉"];
  const mostrarPodio = !!tabla && (podioAMano || podioAutomatico(tabla.filas, cerradoCon));

  function volverALaTabla() {
    setPodioAMano(false);
    setCerradoCon(tabla ? cantidadTerminados(tabla.filas) : null);
  }

  return (
    <main className="page stack-md animate-in" style={{ paddingTop: "clamp(1rem, 3vh, 2rem)", maxWidth: "1400px" }}>
      <div className="row between">
        <Link href="/admin" className="back-link"><ArrowLeft size={16} /> Volver al panel</Link>
        <div className="row" style={{ gap: "0.5rem", flex: "1 1 30rem", justifyContent: "flex-end" }}>
          <select className="select" style={{ flex: "1 1 14rem", maxWidth: "24rem" }} value={quizId} onChange={(e) => elegirQuiz(e.target.value)}>
            <option value="">Elegí el quiz</option>
            {quizzes.map((q) => (
              <option key={q.id} value={q.id}>{q.title}</option>
            ))}
          </select>
          <select className="select" style={{ flex: "1 1 14rem", maxWidth: "24rem" }} value={courseId} onChange={(e) => { setCourseId(e.target.value); setTabla(null); reiniciarPodio(); }} disabled={!quizId}>
            <option value="">{quizId && cursos.length === 0 ? "Ningún curso tiene este quiz" : "Elegí el curso"}</option>
            {cursos.map((c) => (
              <option key={c.id} value={c.id}>{`${c.modalidad} · ${c.escuela} · ${c.name}`}</option>
            ))}
          </select>
        </div>
      </div>

      {!tabla || !quiz || !curso ? (
        <div className="card" style={{ textAlign: "center" }}>
          <p className="lead">Elegí el quiz y el curso para ver el ranking en vivo.</p>
        </div>
      ) : (
        <div className="stack-md">
          <header style={{ textAlign: "center" }}>
            <h1 style={{ fontSize: "clamp(2rem, 5vw, 3.5rem)", fontWeight: 800, lineHeight: 1.1, wordBreak: "break-word" }}>{quiz.title}</h1>
            <p className="muted" style={{ fontSize: "clamp(1rem, 2vw, 1.5rem)" }}>
              {curso.escuela} · {curso.name}
              {sinConexion && <span style={{ color: "var(--danger)" }}> · sin conexión, reintentando…</span>}
            </p>
            <div className="row" style={{ justifyContent: "center", marginTop: "0.5rem" }}>
              {mostrarPodio ? (
                <button className="btn btn-ghost" onClick={volverALaTabla}>Volver a la tabla</button>
              ) : (
                <button className="btn btn-primary" onClick={() => setPodioAMano(true)} disabled={!tabla.filas.some((f) => f.empezo)}>
                  🏆 Mostrar podio
                </button>
              )}
            </div>
          </header>

          {mostrarPodio ? (
            <Podio puestos={primerosTres(tabla.filas)} />
          ) : (
            <>

          {tabla.filas.length === 0 ? (
            <div className="card" style={{ textAlign: "center" }}>
              <p className="lead">Este curso no tiene alumnos.</p>
            </div>
          ) : (
            <div className="stack-sm" style={{ gap: "0.5rem" }}>
              {tabla.filas.map((f, i) => (
                <div
                  key={f.id}
                  className="card"
                  style={{
                    display: "grid",
                    gridTemplateColumns: "minmax(3ch, auto) 1fr auto auto",
                    alignItems: "center",
                    gap: "clamp(0.75rem, 2vw, 2rem)",
                    padding: "0.6rem 1.2rem",
                    fontSize: "clamp(1.3rem, 3vw, 2.4rem)",
                    opacity: f.empezo ? 1 : 0.45,
                  }}
                >
                  <span style={{ fontWeight: 800 }}>{f.empezo ? (medallas[i] ?? `${i + 1}º`) : "–"}</span>
                  <span style={{ fontWeight: 700, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{f.nombre}</span>
                  <span className="muted" style={{ fontSize: "0.6em", whiteSpace: "nowrap" }}>
                    {f.empezo ? `${f.respondidas}/${tabla.totalPreguntas}${f.terminado ? " ✓" : ""}` : "sin empezar"}
                  </span>
                  <span style={{ fontWeight: 800, textAlign: "right", minWidth: "4ch" }}>{f.puntos}</span>
                </div>
              ))}
            </div>
          )}
            </>
          )}
        </div>
      )}
    </main>
  );
}
