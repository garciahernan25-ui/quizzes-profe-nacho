import { db } from "../../../lib/db";
import { quizzes, rounds, questions } from "../../../lib/db/schema";
import { eq } from "drizzle-orm";
import { cookies } from "next/headers";
import QuizGame from "./QuizGame";

export default async function QuizPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  // Leer cookie de sesión del estudiante
  const cookieStore = await cookies();
  const studentName = cookieStore.get("student_name")?.value || null;

  const quiz = (await db.select().from(quizzes).where(eq(quizzes.slug, slug)))[0];

  if (!quiz) {
    return (
      <main style={{ padding: "3rem", textAlign: "center" }}>
        <h1>Quiz no encontrado</h1>
        <a href="/">Volver al inicio</a>
      </main>
    );
  }

  const rondas = await db.select().from(rounds).where(eq(rounds.quizId, quiz.id));

  const rondasConPreguntas = await Promise.all(
    rondas.map(async (ronda) => {
      const preguntas = await db
        .select()
        .from(questions)
        .where(eq(questions.roundId, ronda.id));
      return {
        id: ronda.id,
        name: ronda.name,
        icon: ronda.icon,
        description: ronda.description,
        order: ronda.order ?? 0,
        questions: preguntas
          .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
          .map((p) => ({
            id: p.id,
            question: p.question,
            questionImage: p.questionImage,
            options: JSON.parse(p.options) as string[],
            optionImages: p.optionImages ? (JSON.parse(p.optionImages) as string[]) : null,
            correctIndex: p.correctIndex,
            explanation: p.explanation,
          })),
      };
    })
  );

  rondasConPreguntas.sort((a, b) => a.order - b.order);

  return (
    <QuizGame
      quizTitle={quiz.title}
      rondas={rondasConPreguntas}
      studentName={studentName}
    />
  );
}