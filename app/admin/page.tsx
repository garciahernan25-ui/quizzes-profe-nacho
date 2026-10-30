export const dynamic = "force-dynamic";
import { db } from "../../lib/db";
import { quizzes, rounds, questions } from "../../lib/db/schema";
import { eq } from "drizzle-orm";
import Link from "next/link";
import BotonCopiar from "./BotonCopiar";
import BotonQR from "./BotonQR";
import BotonSalir from "./BotonSalir";
import BotonBorrarQuiz from "./BotonBorrarQuiz";
import Navbar from "../components/Navbar";
import { Plus, ChartBar, Trophy } from "../components/icons";
import { cantidadPendientes } from "../../lib/alumnos";

export default async function AdminPage() {
  const listaQuizzes = await db.select().from(quizzes);
  const cantPendientes = await cantidadPendientes(db);

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
    <>
      <Navbar right={<BotonSalir />} />
      <main className="page stack-lg animate-in">
        <header className="stack-sm">
          <span className="eyebrow">Administración</span>
          <h1 className="h1">Tus quizzes</h1>
          <p className="lead">Creá, editá y hacé seguimiento de tus alumnos.</p>
        </header>

        <div className="row">
          <Link href="/admin/nuevo-quiz" className="btn btn-primary"><Plus size={17} /> Nuevo quiz</Link>
          <Link href="/admin/nueva-seccion" className="btn btn-ghost"><Plus size={17} /> Nueva sección</Link>
          <Link href="/admin/preguntas" className="btn btn-ghost">Gestionar preguntas</Link>
          <Link href="/admin/pendientes" className={`btn ${cantPendientes > 0 ? "btn-primary" : "btn-ghost"}`}>
            Alumnos pendientes
            <span className="badge" style={{ marginLeft: "0.15rem", ...(cantPendientes > 0 ? { background: "var(--warning)", color: "#000", borderColor: "transparent" } : {}) }}>
              {cantPendientes}
            </span>
          </Link>
          <Link href="/admin/seguimiento" className="btn btn-ghost"><ChartBar size={16} /> Seguimiento de alumnos</Link>
          <Link href="/admin/escuelas" className="btn btn-ghost">Escuelas y cursos</Link>
          <Link href="/admin/ranking" className="btn btn-ghost"><Trophy size={16} /> Ranking en vivo</Link>
        </div>

        {filas.length === 0 ? (
          <div className="card" style={{ textAlign: "center" }}>
            <p className="lead">Todavía no hay quizzes creados.</p>
          </div>
        ) : (
          <div className="grid-cards">
            {filas.map((fila) => (
              <div key={fila.id} className="card stack-md">
                <div className="row between" style={{ alignItems: "flex-start" }}>
                  <h2 className="h2" style={{ wordBreak: "break-word" }}>{fila.title}</h2>
                  <span className={`badge ${fila.publicado ? "badge-success" : "badge-muted"}`}>
                    <span className="dot" style={{ background: fila.publicado ? "var(--success)" : "var(--text-muted)" }} />
                    {fila.publicado ? "Abierto sin cuenta" : "Solo con cuenta"}
                  </span>
                </div>

                <div className="row" style={{ gap: "0.5rem" }}>
                  <span className="badge">{fila.cantRondas} rondas</span>
                  <span className="badge">{fila.cantPreguntas} preguntas</span>
                </div>

                <div className="row" style={{ gap: "0.5rem" }}>
                  <BotonCopiar slug={fila.slug} />
                  <BotonQR slug={fila.slug} titulo={fila.title} />
                  <Link href={`/admin/quiz/${fila.id}`} className="btn btn-ghost btn-sm">
                    Preguntas y cursos
                  </Link>
                  <BotonBorrarQuiz quizId={fila.id} titulo={fila.title} />
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </>
  );
}