export const dynamic = "force-dynamic";
import { db } from "../../../lib/db";
import { quizzes, students } from "../../../lib/db/schema";
import { eq } from "drizzle-orm";
import { cookies } from "next/headers";
import Link from "next/link";
import Navbar from "../../components/Navbar";
import Juego from "./Juego";
import { alumnoLogueado } from "../../../lib/estudiante";
import { preguntasDelQuiz, verificarAcceso } from "../../../lib/intentos";

export default async function QuizPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const cookieStore = await cookies();
  const studentId = await alumnoLogueado();
  // El nombre sale de la base (por si el profe lo corrigió al aprobarlo); la cookie queda de respaldo
  const studentName = studentId
    ? ((await db.select({ fullName: students.fullName }).from(students).where(eq(students.id, studentId)))[0]?.fullName ??
      cookieStore.get("student_name")?.value ??
      null)
    : null;

  const quiz = (await db.select().from(quizzes).where(eq(quizzes.slug, slug)))[0];

  if (!quiz) {
    return <Aviso titulo="Quiz no encontrado" />;
  }

  // Con cuenta: el servidor decide si puede jugar (curso habilitado, un solo intento)
  const acceso = studentId ? await verificarAcceso(db, studentId, quiz.id) : null;

  if (acceso && acceso.tipo !== "sin-cuenta") {
    if (acceso.tipo === "pendiente") {
      return <Aviso titulo="Tu usuario está esperando que el profe lo apruebe" texto="Apenas te apruebe, vas a ver tus quizzes en el inicio." />;
    }
    if (acceso.tipo === "bloqueado") {
      return <Aviso titulo="Tu usuario está bloqueado" texto="Hablá con el profe." />;
    }
    if (acceso.tipo === "sin-curso") {
      return <Aviso titulo="Todavía no tenés curso asignado" texto="Pedile al profe que te asigne a tu curso para poder hacer los quizzes." />;
    }
    if (acceso.tipo === "no-habilitado") {
      return <Aviso titulo="Este quiz no está habilitado para tu curso" texto="Si creés que es un error, avisale al profe." />;
    }
    if (acceso.tipo === "ya-respondio") {
      return (
        <Aviso
          titulo="Ya respondiste este quiz"
          texto={acceso.nota !== null ? `Tu nota: ${acceso.nota.toFixed(1)} / 10` : "Tu resultado ya está guardado."}
        />
      );
    }
    return (
      <Juego
        quizTitle={quiz.title}
        studentName={studentName}
        modo={{ tipo: "cuenta", quizId: quiz.id }}
        timeLimit={quiz.timeLimit ?? null}
      />
    );
  }

  // Sin cuenta: solo los quizzes abiertos (feria). No se guarda nada.
  if (!quiz.isPublished) {
    return (
      <Aviso titulo="Este quiz es para alumnos con cuenta" texto="Ingresá con tu usuario para hacerlo.">
        <Link href="/ingresar" className="btn btn-primary btn-lg" style={{ alignSelf: "center" }}>Ingresar</Link>
      </Aviso>
    );
  }

  const preguntas = (await preguntasDelQuiz(db, quiz.id)).map(({ pregunta: p, seccion }) => ({
    seccion,
    question: p.question,
    questionImage: p.questionImage,
    options: JSON.parse(p.options) as string[],
    optionImages: p.optionImages ? (JSON.parse(p.optionImages) as string[]) : null,
    correctIndex: p.correctIndex,
    explanation: p.explanation,
  }));

  return (
    <Juego
      quizTitle={quiz.title}
      studentName={null}
      modo={{ tipo: "libre", preguntas }}
      timeLimit={quiz.timeLimit ?? null}
    />
  );
}

function Aviso({ titulo, texto, children }: { titulo: string; texto?: string; children?: React.ReactNode }) {
  return (
    <>
      <Navbar back={{ href: "/", label: "Volver" }} />
      <main className="page page-narrow animate-in" style={{ paddingTop: "clamp(2rem, 8vh, 5rem)" }}>
        <div className="card card-pad-lg stack-md" style={{ textAlign: "center" }}>
          <h1 className="h2">{titulo}</h1>
          {texto && <p className="lead">{texto}</p>}
          {children}
          <Link href="/" className="btn btn-ghost" style={{ alignSelf: "center" }}>Volver al inicio</Link>
        </div>
      </main>
    </>
  );
}
