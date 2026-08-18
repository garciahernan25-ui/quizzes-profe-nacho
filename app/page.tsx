import { db } from "../lib/db";
import { quizzes } from "../lib/db/schema";
import { eq } from "drizzle-orm";
import Link from "next/link";

export default async function Home() {
  // Traer los quizzes publicados desde la base de datos
  const listaQuizzes = await db
    .select()
    .from(quizzes)
    .where(eq(quizzes.isPublished, true));

  return (
    <main style={{ padding: "3rem", maxWidth: "800px", margin: "0 auto" }}>
      <h1 style={{ fontSize: "2.2rem", fontWeight: "bold", marginBottom: "0.5rem" }}>
        Quizzes Profe Nacho
      </h1>
            <a href="/ingresar" style={{
        display: "inline-block", marginBottom: "1.5rem", padding: "0.6rem 1.2rem",
        borderRadius: "10px", background: "#2563eb", color: "white",
        textDecoration: "none", fontWeight: "bold",
      }}>
        Ingresar / Registrarse
      </a>
      <p style={{ color: "#555", marginBottom: "2rem" }}>
        Elegí un quiz para empezar a jugar.
      </p>

      {listaQuizzes.length === 0 ? (
        <p>Todavía no hay quizzes publicados.</p>
      ) : (
        <div style={{ display: "grid", gap: "1rem" }}>
          {listaQuizzes.map((quiz) => (
            <Link
              key={quiz.id}
              href={`/quiz/${quiz.slug}`}
              style={{
                display: "block",
                padding: "1.5rem",
                borderRadius: "12px",
                border: "1px solid #ddd",
                textDecoration: "none",
                color: "inherit",
                boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
              }}
            >
              <div style={{ fontSize: "2rem" }}>{quiz.icon}</div>
              <h2 style={{ fontSize: "1.4rem", fontWeight: "bold", margin: "0.5rem 0" }}>
                {quiz.title}
              </h2>
              <p style={{ color: "#555", margin: 0 }}>{quiz.description}</p>
              <p style={{ color: "#888", fontSize: "0.9rem", marginTop: "0.5rem" }}>
                {quiz.subject} · {quiz.level}
              </p>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}