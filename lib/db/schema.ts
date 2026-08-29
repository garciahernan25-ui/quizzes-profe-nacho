import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

// Tabla de quizzes (cada quiz agrupa varias rondas)
export const quizzes = sqliteTable("quizzes", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  slug: text("slug").notNull().unique(),
  icon: text("icon"),
  subject: text("subject"),
  level: text("level"),
  isPublished: integer("is_published", { mode: "boolean" }).default(false),
  createdAt: integer("created_at", { mode: "timestamp" }),
  updatedAt: integer("updated_at", { mode: "timestamp" }),
});

// Tabla de rondas (cada ronda pertenece a un quiz)
export const rounds = sqliteTable("rounds", {
  id: text("id").primaryKey(),
  quizId: text("quiz_id").references(() => quizzes.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  icon: text("icon"),
  description: text("description"),
  order: integer("order").default(0),
});

// Tabla de preguntas (soporta imagen en la pregunta Y en cada respuesta)
export const questions = sqliteTable("questions", {
  id: text("id").primaryKey(),
  roundId: text("round_id").references(() => rounds.id, { onDelete: "cascade" }),
  question: text("question").notNull(),
  questionImage: text("question_image"),
  options: text("options").notNull(),
  optionImages: text("option_images"),
  correctIndex: integer("correct_index").notNull(),
  explanation: text("explanation"),
  order: integer("order").default(0),
});

// Tabla de puntajes
export const scores = sqliteTable("scores", {
  id: text("id").primaryKey(),
  quizId: text("quiz_id").references(() => quizzes.id, { onDelete: "cascade" }),
  roundId: text("round_id").references(() => rounds.id, { onDelete: "cascade" }),
  playerName: text("player_name"),
  score: integer("score").notNull(),
  totalQuestions: integer("total_questions").notNull(),
  correctAnswers: integer("correct_answers").notNull(),
  playedAt: integer("played_at", { mode: "timestamp" }),
});

export const students = sqliteTable("students", {
  id: text("id").primaryKey(),
  fullName: text("full_name").notNull(),
  username: text("username").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  modality: text("modality").notNull(),
  school: text("school").notNull(),
  year: text("year"),
  division: text("division"),
  extraInfo: text("extra_info"),
  createdAt: integer("created_at", { mode: "timestamp" }),
});