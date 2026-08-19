import { db } from "../lib/db";
import { quizzes } from "../lib/db/schema";
import { eq } from "drizzle-orm";
import Link from "next/link";

export default async function Home() {
  const listaQuizzes = await db
    .select()
    .from(quizzes)
    .where(eq(quizzes.isPublished, true));

  return (
    <main style={{ padding: "3rem", maxWidth: "800px", margin: "0 auto" }}>
      <h1 style={{ fontSize: "2.2rem", fontWeight: "bold", marginBottom: "0.5rem" }}>
        Quizzes Profe Nacho
      </h1>
      <a
        href="/ingresar"
        style={{
          display: "inline-block",
          marginBottom: "1.5rem",
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
      <p style={{ color: "var(--text-secondary)", marginBottom: "2rem" }}>
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
                border: "1px solid var(--card-border)",
                textDecoration: "none",
                color: "inherit",
                backgroundColor: "var(--card-bg)",
                boxShadow: "var(--shadow)",
              }}
            >
              <div style={{ fontSize: "2rem" }}>{quiz.icon}</div>
              <h2 style={{ fontSize: "1.4rem", fontWeight: "bold", margin: "0.5rem 0" }}>
                {quiz.title}
              </h2>
              <p style={{ color: "var(--text-secondary)", margin: 0 }}>
                {quiz.description}
              </p>
              <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", marginTop: "0.5rem" }}>
                {quiz.subject} · {quiz.level}
              </p>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}