import { db } from "../lib/db";
import { quizzes } from "../lib/db/schema";
import { eq } from "drizzle-orm";
import Link from "next/link";
import { cookies } from "next/headers";
import LogoutButton from "./LogoutButton";
import Navbar from "./components/Navbar";

export default async function Home() {
  // Leer cookie de sesión del estudiante
  const cookieStore = await cookies();
  const studentName = cookieStore.get("student_name")?.value;

  const listaQuizzes = await db
    .select()
    .from(quizzes)
    .where(eq(quizzes.isPublished, true));

  return (
    <>
      <Navbar
        right={
          studentName ? (
            <>
              <span className="meta-pill">👋 Hola, {studentName}</span>
              <LogoutButton />
            </>
          ) : (
            <Link href="/ingresar" className="btn btn-primary btn-sm">
              Ingresar
            </Link>
          )
        }
      />

      <main className="page page-mid stack-lg animate-in">
        <header className="stack-md" style={{ paddingTop: "1.5rem" }}>
          <span className="eyebrow">Plataforma de quizzes</span>
          <h1 className="h-hero">Aprendé jugando,<br />un quiz a la vez.</h1>
          <p className="lead">Elegí un quiz para empezar. Sumás puntos por acertar rápido.</p>
        </header>

        {listaQuizzes.length === 0 ? (
          <div className="card" style={{ textAlign: "center" }}>
            <p className="lead">Todavía no hay quizzes publicados.</p>
          </div>
        ) : (
          <section className="grid-cards">
            {listaQuizzes.map((quiz) => (
              <Link
                key={quiz.id}
                href={`/quiz/${quiz.slug}`}
                className="card card-link"
              >
                <div className="card-icon">{quiz.icon}</div>
                <h2 className="h2" style={{ marginBottom: "0.35rem" }}>{quiz.title}</h2>
                <p className="lead" style={{ fontSize: "0.95rem", marginBottom: "1rem" }}>
                  {quiz.description}
                </p>
                <div className="row" style={{ gap: "0.5rem" }}>
                  {quiz.subject && <span className="badge">{quiz.subject}</span>}
                  {quiz.level && <span className="badge badge-muted">{quiz.level}</span>}
                </div>
              </Link>
            ))}
          </section>
        )}
      </main>
    </>
  );
}
