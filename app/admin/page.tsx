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
    <main style={{ padding: "3rem", maxWidth: "1000px", margin: "0 auto" }}>
      <h1 style={{ fontSize: "2rem", fontWeight: "bold", marginBottom: "0.5rem" }}>
        Panel de administración
      </h1>
            <div style={{ marginBottom: "1rem" }}>
        <BotonSalir />
      </div>
            <a href="/admin/seguimiento" style={{
        display: "inline-block", marginBottom: "1.5rem", padding: "0.7rem 1.2rem",
        borderRadius: "10px", background: "#7c3aed", color: "white",
        textDecoration: "none", fontWeight: "bold",
      }}>
        📊 Seguimiento de alumnos
      </a>
      <p style={{ color: "#555", marginBottom: "2rem" }}>
        Acá vas a poder gestionar tus quizzes.
      </p>

      <a href="/admin/nuevo-quiz" style={{
        display: "inline-block", marginBottom: "1.5rem", padding: "0.7rem 1.2rem",
        borderRadius: "10px", background: "#16a34a", color: "white",
        textDecoration: "none", fontWeight: "bold",
      }}>
        + Nuevo quiz
      </a>
            <a href="/admin/nueva-seccion" style={{
        display: "inline-block", marginBottom: "1.5rem", marginLeft: "0.8rem", padding: "0.7rem 1.2rem",
        borderRadius: "10px", background: "#0ea5e9", color: "white",
        textDecoration: "none", fontWeight: "bold",
      }}>
        + Nueva sección
      </a>
            <a href="/admin/preguntas" style={{
        display: "inline-block", marginBottom: "1.5rem", marginLeft: "0.8rem", padding: "0.7rem 1.2rem",
        borderRadius: "10px", background: "#6b7280", color: "white",
        textDecoration: "none", fontWeight: "bold",
      }}>
        Gestionar preguntas
      </a>

      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr style={{ borderBottom: "2px solid #ddd", textAlign: "left" }}>
            <th style={{ padding: "0.75rem" }}>Título</th>
            <th style={{ padding: "0.75rem" }}>Rondas</th>
            <th style={{ padding: "0.75rem" }}>Preguntas</th>
            <th style={{ padding: "0.75rem" }}>Estado</th>
            <th style={{ padding: "0.75rem" }}>Enlace</th>
          </tr>
        </thead>
        <tbody>
          {filas.map((fila) => (
            <tr key={fila.id} style={{ borderBottom: "1px solid #eee" }}>
              <td style={{ padding: "0.75rem", fontWeight: "bold" }}>{fila.title}</td>
              <td style={{ padding: "0.75rem" }}>{fila.cantRondas}</td>
              <td style={{ padding: "0.75rem" }}>{fila.cantPreguntas}</td>
              <td style={{ padding: "0.75rem" }}>
                {fila.publicado ? (
                  <span style={{ color: "#16a34a" }}>● Publicado</span>
                ) : (
                  <span style={{ color: "#999" }}>○ Borrador</span>
                )}
              </td>
                            <td style={{ padding: "0.75rem" }}>
                <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                  <BotonCopiar slug={fila.slug} />
                  <a
                    href={`/admin/quiz/${fila.id}`}
                    style={{
                      padding: "0.4rem 0.8rem", borderRadius: "8px", border: "1px solid #6b7280",
                      background: "white", color: "#6b7280", textDecoration: "none",
                      fontSize: "0.85rem", whiteSpace: "nowrap",
                    }}
                  >
                    Ver preguntas
                  </a>
                                    <BotonBorrarQuiz quizId={fila.id} titulo={fila.title} />
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </main>
  );
}