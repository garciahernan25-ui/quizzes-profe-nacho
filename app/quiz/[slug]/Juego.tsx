"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Navbar from "../../components/Navbar";
import { Trophy, Clock, Lightbulb, Hand, ArrowRight } from "../../components/icons";
import { puntosDeRespuesta, restanteMs } from "../../../lib/puntaje";
import type { EstadoJuego, PreguntaPublica, ResultadoRespuesta } from "../../../lib/intentos";

// Pregunta completa (con la correcta): solo llega al navegador en los quizzes abiertos sin cuenta
type PreguntaLibre = {
  seccion: string;
  question: string;
  questionImage: string | null;
  options: string[];
  optionImages: string[] | null;
  correctIndex: number;
  explanation: string | null;
};

type Modo = { tipo: "cuenta"; quizId: string } | { tipo: "libre"; preguntas: PreguntaLibre[] };

// De dónde salen las preguntas y quién corrige: el servidor (con cuenta) o el navegador (sin cuenta)
type Fuente = {
  empezar: () => Promise<EstadoJuego>;
  responder: (elegida: number | null) => Promise<ResultadoRespuesta | EstadoJuego>;
  siguiente: () => Promise<EstadoJuego>;
};

function fuenteDelServidor(quizId: string): Fuente {
  let intentoId = "";
  async function pedir(url: string, cuerpo: object) {
    const res = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(cuerpo) });
    if (!res.ok && res.status >= 500) throw new Error("Error del servidor");
    const data = await res.json();
    if (data.tipo === "pregunta") intentoId = data.intentoId;
    return data;
  }
  return {
    empezar: () => pedir("/api/jugar/empezar", { quizId }),
    responder: (elegida) => pedir("/api/jugar/responder", { intentoId, elegida }),
    siguiente: () => pedir("/api/jugar/siguiente", { intentoId }),
  };
}

function fuenteLocal(preguntas: PreguntaLibre[], timeLimit: number | null): Fuente {
  let indice = 0;
  let puntos = 0;
  let correctas = 0;
  let mostradaEn = 0;
  function estado(): EstadoJuego {
    if (indice >= preguntas.length) {
      return { tipo: "final", correctas, total: preguntas.length, nota: Math.round((correctas / preguntas.length) * 100) / 10, puntos };
    }
    mostradaEn = Date.now();
    const p = preguntas[indice];
    const pregunta: PreguntaPublica = {
      seccion: p.seccion,
      question: p.question,
      questionImage: p.questionImage,
      options: p.options,
      optionImages: p.optionImages,
      numero: indice + 1, total: preguntas.length, limiteMs: timeLimit ? timeLimit * 1000 : null, restanteMs: restanteMs(timeLimit, 0) };
    return { tipo: "pregunta", intentoId: "", puntos, pregunta };
  }
  return {
    empezar: async () => (preguntas.length === 0 ? { tipo: "sin-preguntas" } : estado()),
    responder: async (elegida) => {
      const p = preguntas[indice];
      const correcta = elegida === p.correctIndex;
      const ganados = puntosDeRespuesta(correcta, timeLimit, Date.now() - mostradaEn);
      puntos += ganados;
      if (correcta) correctas++;
      return { tipo: "respuesta", correcta, correctIndex: p.correctIndex, explanation: p.explanation, puntosGanados: ganados, puntos, terminado: indice === preguntas.length - 1 };
    },
    siguiente: async () => {
      indice++;
      return estado();
    },
  };
}

export default function Juego({
  quizTitle,
  studentName,
  modo,
  timeLimit,
}: {
  quizTitle: string;
  studentName: string | null;
  modo: Modo;
  timeLimit: number | null;
}) {
  const fuente = useRef<Fuente | null>(null);
  if (!fuente.current) {
    fuente.current = modo.tipo === "cuenta" ? fuenteDelServidor(modo.quizId) : fuenteLocal(modo.preguntas, timeLimit);
  }

  const [estado, setEstado] = useState<EstadoJuego | null>(null);
  const [resultado, setResultado] = useState<ResultadoRespuesta | null>(null);
  const [elegida, setElegida] = useState<number | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState("");
  const [tiempo, setTiempo] = useState<number | null>(null); // segundos que le quedan (solo para mostrar)

  const pregunta = estado?.tipo === "pregunta" ? estado.pregunta : null;

  // Cuenta regresiva en pantalla. El que decide si llegó a tiempo es el servidor.
  useEffect(() => {
    if (!pregunta || resultado || pregunta.restanteMs === null) return;
    const fin = Date.now() + pregunta.restanteMs;
    const t = setInterval(() => {
      const quedan = Math.max(0, Math.ceil((fin - Date.now()) / 1000));
      setTiempo(quedan);
      if (quedan === 0) {
        clearInterval(t);
        enviar(null);
      }
    }, 250);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pregunta, resultado]);

  async function ejecutar(accion: () => Promise<ResultadoRespuesta | EstadoJuego>) {
    setEnviando(true);
    setError("");
    try {
      const r = await accion();
      if (r.tipo === "respuesta") {
        setResultado(r);
      } else {
        setResultado(null);
        setElegida(null);
        setEstado(r);
        if (r.tipo === "pregunta") {
          const ms = r.pregunta.restanteMs;
          setTiempo(ms === null ? null : Math.ceil(ms / 1000));
        }
      }
    } catch {
      setError("Se cortó la conexión. Revisá internet y tocá de nuevo.");
    } finally {
      setEnviando(false);
    }
  }

  function enviar(opcion: number | null) {
    if (resultado || enviando) return;
    setElegida(opcion);
    ejecutar(() => fuente.current!.responder(opcion));
  }

  // Después de la última pregunta, "siguiente" devuelve el resultado final
  function siguiente() {
    if (!resultado) return;
    ejecutar(() => fuente.current!.siguiente());
  }

  async function cerrarSesion() {
    try {
      await fetch("/api/logout-estudiante", { method: "POST" });
      window.location.reload();
    } catch (error) {
      console.error("Error al cerrar sesión", error);
    }
  }

  // PANTALLA 1: empezar
  if (!estado) {
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
        <main className="page page-narrow animate-in" style={{ paddingTop: "clamp(2rem, 8vh, 5rem)" }}>
          <div className="card card-pad-lg stack-md" style={{ textAlign: "center" }}>
            <h1 className="h-hero" style={{ wordBreak: "break-word" }}>{quizTitle}</h1>
            {timeLimit !== null && <p className="lead icon-inline" style={{ justifyContent: "center" }}><Clock size={16} /> {timeLimit} segundos por pregunta</p>}
            {modo.tipo === "cuenta" ? (
              <p className="lead">Tenés <b>un solo intento</b>. Si se te corta internet, volvé a entrar y seguís donde quedaste (el reloj sigue corriendo).</p>
            ) : (
              <p className="lead">Estás jugando sin cuenta: tu resultado no se guarda.</p>
            )}
            {error && <div className="notice notice-error">{error}</div>}
            <button onClick={() => ejecutar(() => fuente.current!.empezar())} disabled={enviando} className="btn btn-primary btn-lg" style={{ alignSelf: "center" }}>
              {enviando ? "Cargando..." : "Empezar"}
              <ArrowRight size={18} />
            </button>
          </div>
        </main>
      </>
    );
  }

  // PANTALLA 3: resultado final (o un aviso)
  if (estado.tipo !== "pregunta") {
    let titulo = "No se pudo cargar el quiz";
    let texto = "Volvé a entrar desde el inicio.";
    if (estado.tipo === "sin-preguntas") titulo = "Este quiz todavía no tiene preguntas.";
    if (estado.tipo === "bloqueado") {
      const a = estado.acceso;
      if (a.tipo === "ya-respondio") {
        titulo = "Ya respondiste este quiz";
        texto = a.nota !== null ? `Tu nota: ${a.nota.toFixed(1)} / 10` : "Tu resultado ya está guardado.";
      } else if (a.tipo === "no-habilitado") titulo = "Este quiz no está habilitado para tu curso";
      else if (a.tipo === "sin-curso") titulo = "Todavía no tenés curso asignado";
      else if (a.tipo === "sin-cuenta") titulo = "Tenés que ingresar con tu cuenta";
      else if (a.tipo === "pendiente") {
        titulo = "Tu usuario está esperando que el profe lo apruebe";
        texto = "Volvé al inicio: apenas te apruebe, vas a ver tus quizzes.";
      } else if (a.tipo === "bloqueado") {
        titulo = "Tu usuario está bloqueado";
        texto = "Hablá con el profe.";
      }
    }

    if (estado.tipo === "final") {
      const nota = estado.nota;
      let mensaje = "A repasar y probar de nuevo.";
      if (nota >= 8.5) mensaje = "¡Genio total!";
      else if (nota >= 6) mensaje = "¡Muy bien!";
      else if (nota >= 3.5) mensaje = "Bien encaminado.";
      return (
        <>
          <Navbar />
          <main className="page page-narrow animate-in" style={{ paddingTop: "clamp(2rem, 8vh, 5rem)" }}>
            <div className="card card-pad-lg stack-md" style={{ textAlign: "center" }}>
              <span className="eyebrow">{quizTitle}</span>
              <div className="score-number">
                {nota.toFixed(1)}
                <span style={{ fontSize: "1.5rem", color: "var(--text-muted)", WebkitTextFillColor: "var(--text-muted)" }}> / 10</span>
              </div>
              <p className="h2">{mensaje}</p>
              <p className="lead">Correctas: {estado.correctas} de {estado.total}</p>
              <p className="lead icon-inline" style={{ justifyContent: "center" }}><Trophy size={16} /> {estado.puntos} puntos</p>
              <Link href="/" className="btn btn-primary btn-lg" style={{ alignSelf: "center" }}>Volver al inicio</Link>
            </div>
          </main>
        </>
      );
    }

    return (
      <>
        <Navbar />
        <main className="page page-narrow animate-in" style={{ paddingTop: "clamp(2rem, 8vh, 5rem)" }}>
          <div className="card card-pad-lg stack-md" style={{ textAlign: "center" }}>
            <h1 className="h2">{titulo}</h1>
            <p className="lead">{texto}</p>
            <Link href="/" className="btn btn-primary btn-lg" style={{ alignSelf: "center" }}>Volver al inicio</Link>
          </div>
        </main>
      </>
    );
  }

  // PANTALLA 2: jugando
  const p = pregunta!;
  const respondida = resultado !== null;
  const puntos = resultado ? resultado.puntos : estado.puntos;
  const progreso = ((p.numero - 1 + (respondida ? 1 : 0)) / p.total) * 100;

  return (
    <>
      <Navbar right={<span className="badge"><Trophy size={14} /> {puntos}</span>} />
      <main className="page page-mid stack-md animate-in">
        <div className="stack-sm" style={{ gap: "0.5rem" }}>
          <div className="row between muted">
            <span>Pregunta {p.numero} de {p.total}{p.seccion ? ` · ${p.seccion}` : ""}</span>
            {!respondida && tiempo !== null && (
              <span className="icon-inline"><Clock size={14} /> {tiempo}s</span>
            )}
          </div>
          <div className="progress-track">
            <div className="progress-fill" style={{ width: `${progreso}%` }} />
          </div>
          {!respondida && p.limiteMs !== null && tiempo !== null && (
            <div className="timebar" style={{ marginTop: "0.15rem" }}>
              <div className="timebar-fill" style={{ width: `${((tiempo * 1000) / p.limiteMs) * 100}%` }} />
            </div>
          )}
        </div>

        <h2 className="h1" style={{ fontSize: "1.55rem" }}>{p.question}</h2>

        {p.questionImage && (
          <img src={p.questionImage} alt="" style={{ borderRadius: "var(--r-md)" }} />
        )}

        <div className="grid-1">
          {p.options.map((opcion, i) => {
            let cls = "option";
            if (resultado) {
              if (i === resultado.correctIndex) cls += " option-correct";
              else if (i === elegida) cls += " option-wrong";
            }
            return (
              <button key={i} onClick={() => enviar(i)} disabled={respondida || enviando} className={cls}>
                {p.optionImages && p.optionImages[i] ? (
                  <img src={p.optionImages[i]} alt="" style={{ maxWidth: "100%", borderRadius: "var(--r-sm)" }} />
                ) : (
                  opcion
                )}
              </button>
            );
          })}
        </div>

        {error && <div className="notice notice-error">{error}</div>}

        {resultado && (
          <p className="lead animate-in" style={{ fontWeight: 650 }}>
            {resultado.correcta
              ? `¡Correcto! +${resultado.puntosGanados} puntos`
              : elegida === null || elegida === resultado.correctIndex
                ? "Se acabó el tiempo."
                : "Incorrecto."}
          </p>
        )}

        {resultado && resultado.explanation && (
          <div className="explanation animate-in" style={{ display: "flex", gap: "0.6rem", alignItems: "flex-start" }}>
            <Lightbulb size={18} style={{ flexShrink: 0, marginTop: 2, color: "var(--brand-hover)" }} />
            <span>{resultado.explanation}</span>
          </div>
        )}

        {resultado && (
          <button onClick={siguiente} disabled={enviando} className="btn btn-primary btn-lg btn-block animate-in">
            {resultado.terminado ? "Ver resultado" : "Siguiente"}
            <ArrowRight size={18} />
          </button>
        )}
      </main>
    </>
  );
}
