import { db } from "../lib/db";
import { quizzes, students } from "../lib/db/schema";
import { eq } from "drizzle-orm";
import Link from "next/link";
import { cookies } from "next/headers";
import LogoutButton from "./LogoutButton";
import Navbar from "./components/Navbar";
import { alumnoLogueado } from "../lib/estudiante";
import { quizzesDelCurso } from "../lib/intentos";
import EsperandoAprobacion from "./EsperandoAprobacion";

export const dynamic = "force-dynamic";

export default async function Home() {
  // Leer cookie de sesión del estudiante
  const cookieStore = await cookies();

  // Con cuenta: los quizzes habilitados para su curso. Sin cuenta: solo los abiertos (feria).
  const studentId = await alumnoLogueado();
  const alumno = studentId
    ? (
        await db
          .select({ courseId: students.courseId, status: students.status, fullName: students.fullName })
          .from(students)
          .where(eq(students.id, studentId))
      )[0]
    : undefined;
  // El nombre sale de la base (por si el profe lo corrigió); la cookie queda de respaldo
  const studentName = alumno?.fullName ?? cookieStore.get("student_name")?.value;
  // Tiene la cookie pero el alumno ya no está: el profe rechazó el registro (o lo borró)
  const registroBorrado = !!studentId && !alumno;
  const aprobado = alumno?.status === "aprobado";
  const sinCurso = aprobado && !alumno.courseId;

  let listaQuizzes: (typeof quizzes.$inferSelect)[] = [];
  if (aprobado && alumno.courseId) listaQuizzes = await quizzesDelCurso(db, alumno.courseId);
  else if (!studentId) listaQuizzes = await db.select().from(quizzes).where(eq(quizzes.isPublished, true));
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

        {alumno?.status === "pendiente" ? (
          <EsperandoAprobacion />
        ) : alumno?.status === "bloqueado" ? (
          <div className="card" style={{ textAlign: "center" }}>
            <p className="lead">Tu usuario está bloqueado. Hablá con el profe.</p>
          </div>
        ) : registroBorrado ? (
          <div className="card stack-md" style={{ textAlign: "center" }}>
            <p className="lead">
              Tu usuario ya no existe. Si te registraste hace poco, el profe no lo aprobó: registrate de nuevo con tu nombre y apellido reales.
            </p>
            <Link href="/registro" className="btn btn-primary" style={{ alignSelf: "center" }}>Registrarme de nuevo</Link>
          </div>
        ) : sinCurso ? (
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
