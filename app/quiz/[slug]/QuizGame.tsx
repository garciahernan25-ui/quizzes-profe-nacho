"use client";

import { useState, useEffect } from "react";

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
}: {
  quizTitle: string;
  rondas: Ronda[];
  studentName: string | null;
}) {
  const [rondaActiva, setRondaActiva] = useState<Ronda | null>(null);
  const [indice, setIndice] = useState(0);
  const [puntaje, setPuntaje] = useState(0);
  const [correctas, setCorrectas] = useState(0); // NUEVO
  const [respondida, setRespondida] = useState(false);
  const [elegida, setElegida] = useState<number | null>(null);
  const [terminado, setTerminado] = useState(false);
  const [tiempo, setTiempo] = useState(100);

  useEffect(() => {
    if (respondida || !rondaActiva || terminado) return;
    const t = setInterval(() => {
      setTiempo((prev) => (prev > 0 ? prev - 2 : 0));
    }, 200);
    return () => clearInterval(t);
  }, [respondida, rondaActiva, indice, terminado]);

  function empezarRonda(ronda: Ronda) {
    setRondaActiva(ronda);
    setIndice(0);
    setPuntaje(0);
    setCorrectas(0);
    setRespondida(false);
    setElegida(null);
    setTerminado(false);
    setTiempo(100);
  }

  function responder(i: number) {
    if (respondida || !rondaActiva) return;
    setElegida(i);
    setRespondida(true);
    const correcta = rondaActiva.questions[indice].correctIndex;
    if (i === correcta) {
      const bonus = Math.round(tiempo / 2);
      setPuntaje((p) => p + 100 + bonus);
      setCorrectas((c) => c + 1); // NUEVO
    }
  }

  function siguiente() {
    if (!rondaActiva) return;
    if (indice < rondaActiva.questions.length - 1) {
      setIndice((n) => n + 1);
      setRespondida(false);
      setElegida(null);
      setTiempo(100);
    } else {
      setTerminado(true);
      guardarPuntaje();
    }
  }

  async function guardarPuntaje() {
    if (!rondaActiva) return;
    // Enviar nota como score (aunque no la usamos, para no romper API)
    const nota = (correctas / rondaActiva.questions.length) * 10;
    try {
      await fetch("/api/guardar-puntaje", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          quizId: null,
          roundId: rondaActiva.id,
          score: Math.round(nota * 10), // entero de décimas
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
      <main style={{ padding: "3rem", maxWidth: "700px", margin: "0 auto" }}>
        <a href="/" style={{ color: "var(--button-bg)", textDecoration: "none" }}>
          ← Volver
        </a>

        {studentName ? (
          <div
            style={{
              margin: "1rem 0",
              padding: "0.7rem 1.2rem",
              borderRadius: "10px",
              background: "var(--card-bg)",
              border: "1px solid var(--card-border)",
              display: "inline-block",
            }}
          >
            👋 ¡Hola, {studentName}!
          </div>
        ) : (
          <a
            href="/ingresar"
            style={{
              display: "inline-block",
              margin: "1rem 0",
              padding: "0.6rem 1.2rem",
              borderRadius: "10px",
              background: "var(--button-bg)",
              color: "var(--button-text)",
              textDecoration: "none",
              fontWeight: "bold",
            }}
          >
            Ingresar / Registrarse
          </a>
        )}

        <h1 style={{ fontSize: "2rem", fontWeight: "bold", margin: "1rem 0" }}>
          {quizTitle}
        </h1>
        <p style={{ color: "var(--text-secondary)", marginBottom: "2rem" }}>
          Elegí una ronda para empezar:
        </p>
        <div style={{ display: "grid", gap: "1rem" }}>
          {rondas.map((ronda) => (
            <button
              key={ronda.id}
              onClick={() => empezarRonda(ronda)}
              style={{
                textAlign: "left",
                padding: "1.5rem",
                borderRadius: "12px",
                border: "1px solid var(--card-border)",
                background: "var(--card-bg)",
                cursor: "pointer",
                boxShadow: "var(--shadow)",
                color: "inherit",
              }}
            >
              <div style={{ fontSize: "1.8rem" }}>{ronda.icon}</div>
              <div style={{ fontSize: "1.3rem", fontWeight: "bold", margin: "0.3rem 0" }}>
                {ronda.name}
              </div>
              <div style={{ color: "var(--text-secondary)", fontSize: "0.95rem" }}>
                {ronda.description}
              </div>
              <div style={{ color: "var(--text-muted)", fontSize: "0.85rem", marginTop: "0.5rem" }}>
                {ronda.questions.length} preguntas
              </div>
            </button>
          ))}
        </div>

        {studentName && (
          <div style={{ marginTop: "2rem", textAlign: "center" }}>
            <button
              onClick={cerrarSesion}
              style={{
                padding: "0.5rem 1.2rem",
                borderRadius: "8px",
                border: "1px solid #ef4444",
                background: "var(--card-bg)",
                color: "#ef4444",
                cursor: "pointer",
                fontSize: "0.9rem",
                fontWeight: "bold",
              }}
            >
              Cerrar sesión
            </button>
          </div>
        )}
      </main>
    );
  }

  // PANTALLA 3: resultado final
  if (terminado) {
    const nota = (correctas / rondaActiva.questions.length) * 10;
    const notaRedondeada = Math.round(nota * 10) / 10;
    let mensaje = "A repasar y probar de nuevo.";
    if (nota >= 8.5) mensaje = "¡Genio total! 🌟";
    else if (nota >= 6) mensaje = "¡Muy bien!";
    else if (nota >= 3.5) mensaje = "Bien encaminado.";
    return (
      <main style={{ padding: "3rem", maxWidth: "600px", margin: "0 auto", textAlign: "center" }}>
        <h1 style={{ fontSize: "1.6rem", color: "var(--text-secondary)" }}>
          {rondaActiva.name}
        </h1>
        <div style={{ fontSize: "3.5rem", fontWeight: "bold", color: "#f59e0b", margin: "1rem 0" }}>
          {notaRedondeada.toFixed(1)} <span style={{ fontSize: "1.5rem", color: "var(--text-muted)" }}>/ 10</span>
        </div>
        <p style={{ fontSize: "1.2rem", marginBottom: "0.5rem" }}>{mensaje}</p>
        <p style={{ color: "var(--text-secondary)", marginBottom: "2rem" }}>
          Correctas: {correctas} de {rondaActiva.questions.length}
        </p>
        <button
          onClick={volverInicio}
          style={{
            padding: "0.9rem 1.5rem",
            borderRadius: "10px",
            border: "none",
            background: "var(--button-bg)",
            color: "var(--button-text)",
            fontSize: "1rem",
            cursor: "pointer",
          }}
        >
          Elegir otra ronda
        </button>
      </main>
    );
  }

  // PANTALLA 2: jugando
  const pregunta = rondaActiva.questions[indice];
  return (
    <main style={{ padding: "3rem", maxWidth: "700px", margin: "0 auto" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          color: "var(--text-muted)",
          marginBottom: "1rem",
        }}
      >
        <span>
          Pregunta {indice + 1} de {rondaActiva.questions.length}
        </span>
        <span>🏆 {puntaje}</span>
      </div>

      <h2 style={{ fontSize: "1.4rem", fontWeight: "bold", marginBottom: "1.5rem" }}>
        {pregunta.question}
      </h2>

      {pregunta.questionImage && (
        <img
          src={pregunta.questionImage}
          alt=""
          style={{ maxWidth: "100%", borderRadius: "10px", marginBottom: "1.5rem" }}
        />
      )}

      <div style={{ display: "grid", gap: "0.8rem" }}>
        {pregunta.options.map((opcion, i) => {
          let fondo = "var(--card-bg)";
          let borde = "var(--card-border)";
          let color = "inherit";
          if (respondida) {
            if (i === pregunta.correctIndex) {
              fondo = "#dcfce7";
              borde = "#22c55e";
              color = "#166534";
            } else if (i === elegida) {
              fondo = "#fee2e2";
              borde = "#ef4444";
              color = "#991b1b";
            }
          }
          return (
            <button
              key={i}
              onClick={() => responder(i)}
              disabled={respondida}
              style={{
                textAlign: "left",
                padding: "1rem",
                borderRadius: "10px",
                border: `2px solid ${borde}`,
                background: fondo,
                color: color,
                cursor: respondida ? "default" : "pointer",
                fontSize: "1rem",
              }}
            >
              {pregunta.optionImages && pregunta.optionImages[i] ? (
                <img
                  src={pregunta.optionImages[i]}
                  alt=""
                  style={{ maxWidth: "100%", borderRadius: "6px" }}
                />
              ) : (
                opcion
              )}
            </button>
          );
        })}
      </div>

      {respondida && (
        <div
          style={{
            marginTop: "1.5rem",
            padding: "1rem",
            borderRadius: "10px",
            background: "var(--card-bg)",
            color: "inherit",
          }}
        >
          {pregunta.explanation}
        </div>
      )}

      {respondida && (
        <button
          onClick={siguiente}
          style={{
            marginTop: "1.5rem",
            width: "100%",
            padding: "1rem",
            borderRadius: "10px",
            border: "none",
            background: "#f59e0b",
            color: "#1f2233",
            fontSize: "1.1rem",
            fontWeight: "bold",
            cursor: "pointer",
          }}
        >
          {indice < rondaActiva.questions.length - 1 ? "Siguiente →" : "Ver resultado 🏁"}
        </button>
      )}
    </main>
  );
}