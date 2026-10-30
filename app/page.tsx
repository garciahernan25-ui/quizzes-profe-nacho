import { db } from "../lib/db";
import { quizzes, students } from "../lib/db/schema";
import { eq } from "drizzle-orm";
import Link from "next/link";
import { cookies } from "next/headers";
import LogoutButton from "./LogoutButton";
import Navbar from "./components/Navbar";
import { alumnoLogueado } from "../lib/estudiante";
import { quizzesDelCurso } from "../lib/intentos";

export const dynamic = "force-dynamic";

export default async function Home() {
  // Leer cookie de sesión del estudiante
  const cookieStore = await cookies();
  const studentName = cookieStore.get("student_name")?.value;

  // Con cuenta: los quizzes habilitados para su curso. Sin cuenta: solo los abiertos (feria).
  const studentId = await alumnoLogueado();
  const alumno = studentId
    ? (await db.select({ courseId: students.courseId }).from(students).where(eq(students.id, studentId)))[0]
    : undefined;
  const sinCurso = !!alumno && !alumno.courseId;

  let listaQuizzes: (typeof quizzes.$inferSelect)[] = [];
  if (alumno?.courseId) listaQuizzes = await quizzesDelCurso(db, alumno.courseId);
  else if (!alumno) listaQuizzes = await db.select().from(quizzes).where(eq(quizzes.isPublished, true));
  listaQuizzes.sort((a, b) => a.title.localeCompare(b.title, "es", { numeric: true }));

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

        {sinCurso ? (
          <div className="card" style={{ textAlign: "center" }}>
            <p className="lead">Todavía no tenés curso asignado. Pedile al profe que te asigne a tu curso.</p>
          </div>
        ) : listaQuizzes.length === 0 ? (
          <div className="card" style={{ textAlign: "center" }}>
            <p className="lead">{alumno ? "Todavía no hay quizzes para tu curso." : "Todavía no hay quizzes abiertos."}</p>
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
