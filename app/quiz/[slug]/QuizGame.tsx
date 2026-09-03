"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Navbar from "../../components/Navbar";
import { Trophy, Clock, Lightbulb, Hand, ArrowRight } from "../../components/icons";
import { tiempoInicial, calcularBonus } from "../../../lib/quizTime";

type Pregunta = {
  id: string;
  question: string;
  questionImage: string | null;
  options: string[];
  optionImages: string[] | null;
  correctIndex: number;
  explanation: string | null;
};

type Ronda = {
  id: string;
  name: string;
  icon: string | null;
  description: string | null;
  questions: Pregunta[];
};

export default function QuizGame({
  quizTitle,
  rondas,
  studentName,
  timeLimit,
}: {
  quizTitle: string;
  rondas: Ronda[];
  studentName: string | null;
  timeLimit: number | null;
}) {
  const [rondaActiva, setRondaActiva] = useState<Ronda | null>(null);
  const [indice, setIndice] = useState(0);
  const [puntaje, setPuntaje] = useState(0);
  const [correctas, setCorrectas] = useState(0);
  const [respondida, setRespondida] = useState(false);
  const [elegida, setElegida] = useState<number | null>(null);
  const [terminado, setTerminado] = useState(false);
  const [tiempo, setTiempo] = useState<number | null>(() => tiempoInicial(timeLimit));

  useEffect(() => {
    if (respondida || !rondaActiva || terminado || tiempo === null) return;
    const t = setInterval(() => {
      setTiempo((prev) => {
        if (prev === null) return prev;
        const nuevo = prev - 1;
        if (nuevo <= 0) {
          clearInterval(t);
          setRespondida(true);
          setElegida(null);
          return 0;
        }
        return nuevo;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [respondida, rondaActiva, indice, terminado, timeLimit]);

  function empezarRonda(ronda: Ronda) {
    if (!ronda.questions || ronda.questions.length === 0) {
      alert("Esta ronda todavía no tiene preguntas cargadas.");
      return;
    }
    setRondaActiva(ronda);
    setIndice(0);
    setPuntaje(0);
    setCorrectas(0);
    setRespondida(false);
    setElegida(null);
    setTerminado(false);
    setTiempo(tiempoInicial(timeLimit));
  }

  function responder(i: number) {
    if (respondida || !rondaActiva) return;
    setElegida(i);
    setRespondida(true);
    const correcta = rondaActiva.questions[indice].correctIndex;
    if (i === correcta) {
      const bonus = calcularBonus(timeLimit, tiempo ?? 0);
      setPuntaje((p) => p + 100 + bonus);
      setCorrectas((c) => c + 1);
    }
  }

  function siguiente() {
    if (!rondaActiva) return;
    if (indice < rondaActiva.questions.length - 1) {
      setIndice((n) => n + 1);
      setRespondida(false);
      setElegida(null);
      setTiempo(tiempoInicial(timeLimit));
    } else {
      setTerminado(true);
      guardarPuntaje();
    }
  }

  async function guardarPuntaje() {
    if (!rondaActiva) return;
    const nota = (correctas / rondaActiva.questions.length) * 10;
    try {
      await fetch("/api/guardar-puntaje", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          quizId: null,
          roundId: rondaActiva.id,
          score: Math.round(nota * 10),
          totalQuestions: rondaActiva.questions.length,
          correctAnswers: correctas,
        }),
      });
    } catch (e) {
      console.error("No se pudo guardar el puntaje", e);
    }
  }

  function volverInicio() {
    setRondaActiva(null);
    setTerminado(false);
  }

  async function cerrarSesion() {
    try {
      await fetch("/api/logout-estudiante", { method: "POST" });
      window.location.reload();
    } catch (error) {
      console.error("Error al cerrar sesión", error);
    }
  }

  // PANTALLA 1: elegir ronda
  if (!rondaActiva) {
    return (
      <>
        <Navbar
          back={{ href: "/", label: "Volver" }}
          right={
            studentName ? (
              <>
                <span className="meta-pill"><Hand size={15} /> Hola, {studentName}</span>
                <button onClick={cerrarSesion} className="btn btn-ghost btn-sm">Cerrar sesión</button>
              </>
            ) : (
              <Link href="/ingresar" className="btn btn-primary btn-sm">Ingresar</Link>
            )
          }
        />

        <main className="page page-mid stack-lg animate-in">
          <header className="stack-sm">
            <span className="eyebrow">Elegí una ronda</span>
            <h1 className="h-hero">{quizTitle}</h1>
            <p className="lead">Tocá una ronda para empezar a jugar.</p>
          </header>

          <div className="grid-1" style={{ gap: "1rem" }}>
            {rondas.map((ronda) => {
              const sinPreguntas = !ronda.questions || ronda.questions.length === 0;
              return (
                <button
                  key={ronda.id}
                  onClick={() => empezarRonda(ronda)}
                  disabled={sinPreguntas}
                  className="card card-link"
                  style={{ textAlign: "left", opacity: sinPreguntas ? 0.55 : 1, cursor: sinPreguntas ? "not-allowed" : "pointer" }}
                >
                  <div className="row between" style={{ alignItems: "flex-start" }}>
                    <div>
                      <div className="card-icon" style={{ marginBottom: "0.75rem" }}>{ronda.icon}</div>
                      <div className="h2" style={{ marginBottom: "0.3rem" }}>{ronda.name}</div>
                      <div className="lead" style={{ fontSize: "0.95rem" }}>{ronda.description}</div>
                    </div>
                    <span className="badge">{ronda.questions.length} preguntas</span>
                  </div>
                </button>
              );
            })}
          </div>
        </main>
      </>
    );
  }

  // PANTALLA 3: resultado final
  if (terminado) {
    const nota = (correctas / rondaActiva.questions.length) * 10;
    const notaRedondeada = Math.round(nota * 10) / 10;
    let mensaje = "A repasar y probar de nuevo.";
    if (nota >= 8.5) mensaje = "¡Genio total!";
    else if (nota >= 6) mensaje = "¡Muy bien!";
    else if (nota >= 3.5) mensaje = "Bien encaminado.";
    return (
      <>
        <Navbar />
        <main className="page page-narrow animate-in" style={{ paddingTop: "clamp(2rem, 8vh, 5rem)" }}>
          <div className="card card-pad-lg stack-md" style={{ textAlign: "center" }}>
            <span className="eyebrow">{rondaActiva.name}</span>
            <div className="score-number">
              {notaRedondeada.toFixed(1)}
              <span style={{ fontSize: "1.5rem", color: "var(--text-muted)", WebkitTextFillColor: "var(--text-muted)" }}> / 10</span>
            </div>
            <p className="h2">{mensaje}</p>
            <p className="lead">Correctas: {correctas} de {rondaActiva.questions.length}</p>
            <button onClick={volverInicio} className="btn btn-primary btn-lg" style={{ alignSelf: "center" }}>
              Elegir otra ronda
            </button>
          </div>
        </main>
      </>
    );
  }

  // PANTALLA 2: jugando
  const pregunta = rondaActiva.questions[indice];

  if (!pregunta) {
    return (
      <>
        <Navbar />
        <main className="page page-narrow animate-in" style={{ paddingTop: "clamp(2rem, 8vh, 5rem)" }}>
          <div className="card card-pad-lg stack-md" style={{ textAlign: "center" }}>
            <h1 className="h2">Esta ronda no tiene preguntas disponibles.</h1>
            <button onClick={volverInicio} className="btn btn-primary btn-lg" style={{ alignSelf: "center" }}>
              Volver a elegir ronda
            </button>
          </div>
        </main>
      </>
    );
  }

  const progreso = ((indice + (respondida ? 1 : 0)) / rondaActiva.questions.length) * 100;
  return (
    <>
      <Navbar right={<span className="badge"><Trophy size={14} /> {puntaje}</span>} />
      <main className="page page-mid stack-md animate-in">
        <div className="stack-sm" style={{ gap: "0.5rem" }}>
          <div className="row between muted">
            <span>Pregunta {indice + 1} de {rondaActiva.questions.length}</span>
            {!respondida && tiempo !== null && (
              <span className="icon-inline"><Clock size={14} /> {tiempo}s</span>
            )}
          </div>
          <div className="progress-track">
            <div className="progress-fill" style={{ width: `${progreso}%` }} />
          </div>
          {!respondida && timeLimit !== null && tiempo !== null && (
            <div className="timebar" style={{ marginTop: "0.15rem" }}>
              <div className="timebar-fill" style={{ width: `${(tiempo / timeLimit) * 100}%` }} />
            </div>
          )}
        </div>

        <h2 className="h1" style={{ fontSize: "1.55rem" }}>{pregunta.question}</h2>

        {pregunta.questionImage && (
          <img src={pregunta.questionImage} alt="" style={{ borderRadius: "var(--r-md)" }} />
        )}

        <div className="grid-1">
          {pregunta.options.map((opcion, i) => {
            let cls = "option";
            if (respondida) {
              if (i === pregunta.correctIndex) cls += " option-correct";
              else if (i === elegida) cls += " option-wrong";
            }
            return (
              <button key={i} onClick={() => responder(i)} disabled={respondida} className={cls}>
                {pregunta.optionImages && pregunta.optionImages[i] ? (
                  <img src={pregunta.optionImages[i]} alt="" style={{ maxWidth: "100%", borderRadius: "var(--r-sm)" }} />
                ) : (
                  opcion
                )}
              </button>
            );
          })}
        </div>

        {respondida && pregunta.explanation && (
          <div className="explanation animate-in" style={{ display: "flex", gap: "0.6rem", alignItems: "flex-start" }}>
            <Lightbulb size={18} style={{ flexShrink: 0, marginTop: 2, color: "var(--brand-hover)" }} />
            <span>{pregunta.explanation}</span>
          </div>
        )}

        {respondida && (
          <button onClick={siguiente} className="btn btn-primary btn-lg btn-block animate-in">
            {indice < rondaActiva.questions.length - 1 ? "Siguiente" : "Ver resultado"}
            <ArrowRight size={18} />
          </button>
        )}
      </main>
    </>
  );
}