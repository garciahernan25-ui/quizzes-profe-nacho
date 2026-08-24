export const dynamic = "force-dynamic";
import { db } from "../../lib/db";
import { quizzes, rounds, questions } from "../../lib/db/schema";
import { eq } from "drizzle-orm";
import BotonCopiar from "./BotonCopiar";
import BotonSalir from "./BotonSalir";
import BotonBorrarQuiz from "./BotonBorrarQuiz";

export default async function AdminPage() {
  const listaQuizzes = await db.select().from(quizzes);

  const filas = await Promise.all(
    listaQuizzes.map(async (quiz) => {
      const rondas = await db.select().from(rounds).where(eq(rounds.quizId, quiz.id));
      let totalPreguntas = 0;
      for (const ronda of rondas) {
        const preguntas = await db.select().from(questions).where(eq(questions.roundId, ronda.id));
        totalPreguntas += preguntas.length;
      }
      return {
        id: quiz.id,
        title: quiz.title,
        slug: quiz.slug,
        publicado: quiz.isPublished,
        cantRondas: rondas.length,
        cantPreguntas: totalPreguntas,
      };
    })
  );

  return (
    <main style={{ padding: "1rem", maxWidth: "1000px", margin: "0 auto" }}>
      <h1 style={{ fontSize: "2rem", fontWeight: "bold", marginBottom: "0.5rem" }}>
        Panel de administración
      </h1>

      <div style={{ marginBottom: "1rem" }}>
        <BotonSalir />
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", gap: "0.8rem", marginBottom: "1.5rem" }}>
        <a
          href="/admin/seguimiento"
          style={{
            display: "inline-block",
            padding: "0.7rem 1.2rem",
            borderRadius: "10px",
            background: "#7c3aed",
            color: "white",
            textDecoration: "none",
            fontWeight: "bold",
          }}
        >
          📊 Seguimiento de alumnos
        </a>
        <a
          href="/admin/nuevo-quiz"
          style={{
            display: "inline-block",
            padding: "0.7rem 1.2rem",
            borderRadius: "10px",
            background: "#16a34a",
            color: "white",
            textDecoration: "none",
            fontWeight: "bold",
          }}
        >
          + Nuevo quiz
        </a>
        <a
          href="/admin/nueva-seccion"
          style={{
            display: "inline-block",
            padding: "0.7rem 1.2rem",
            borderRadius: "10px",
            background: "#0ea5e9",
            color: "white",
            textDecoration: "none",
            fontWeight: "bold",
          }}
        >
          + Nueva sección
        </a>
        <a
          href="/admin/preguntas"
          style={{
            display: "inline-block",
            padding: "0.7rem 1.2rem",
            borderRadius: "10px",
            background: "#6b7280",
            color: "white",
            textDecoration: "none",
            fontWeight: "bold",
          }}
        >
          Gestionar preguntas
        </a>
      </div>

      <p style={{ color: "var(--text-secondary)", marginBottom: "2rem" }}>
        Acá vas a poder gestionar tus quizzes.
      </p>

      {filas.length === 0 ? (
        <p style={{ color: "var(--text-secondary)" }}>Todavía no hay quizzes creados.</p>
      ) : (
        <div style={{ display: "grid", gap: "1rem", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))" }}>
          {filas.map((fila) => (
            <div
              key={fila.id}
              style={{
                border: "1px solid var(--card-border)",
                borderRadius: "12px",
                background: "var(--card-bg)",
                boxShadow: "var(--shadow)",
                padding: "1rem",
                display: "flex",
                flexDirection: "column",
                gap: "0.5rem",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "0.5rem" }}>
                <h2 style={{ fontSize: "1.2rem", fontWeight: "bold", margin: 0, wordBreak: "break-word" }}>
                  {fila.title}
                </h2>
                <span
                  style={{
                    whiteSpace: "nowrap",
                    fontSize: "0.85rem",
                    fontWeight: "bold",
                    color: fila.publicado ? "#16a34a" : "var(--text-muted)",
                    border: `1px solid ${fila.publicado ? "#16a34a" : "var(--card-border)"}`,
                    borderRadius: "20px",
                    padding: "0.2rem 0.6rem",
                    backgroundColor: fila.publicado ? "#dcfce7" : "transparent",
                  }}
                >
                  {fila.publicado ? "● Publicado" : "○ Borrador"}
                </span>
              </div>

              <div style={{ display: "flex", gap: "1rem", color: "var(--text-secondary)", fontSize: "0.9rem" }}>
                <span>Rondas: {fila.cantRondas}</span>
                <span>Preguntas: {fila.cantPreguntas}</span>
              </div>

              <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", marginTop: "0.5rem" }}>
                <BotonCopiar slug={fila.slug} />
                <a
                  href={`/admin/quiz/${fila.id}`}
                  style={{
                    padding: "0.4rem 0.8rem",
                    borderRadius: "8px",
                    border: "1px solid var(--button-bg)",
                    background: "var(--card-bg)",
                    color: "var(--button-bg)",
                    textDecoration: "none",
                    fontSize: "0.85rem",
                    whiteSpace: "nowrap",
                  }}
                >
                  Ver preguntas
                </a>
                <BotonBorrarQuiz quizId={fila.id} titulo={fila.title} />
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}