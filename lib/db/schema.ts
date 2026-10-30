import { sqliteTable, text, integer, real, index, uniqueIndex, primaryKey } from "drizzle-orm/sqlite-core";

// Tabla de quizzes (cada quiz agrupa varias rondas)
export const quizzes = sqliteTable("quizzes", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  slug: text("slug").notNull().unique(),
  icon: text("icon"),
  subject: text("subject"),
  level: text("level"),
  timeLimit: integer("time_limit"), // NUEVO: segundos o null
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
  // Intento del que salió esta nota (null = nota del sistema anterior, por sección)
  attemptId: text("attempt_id"),
});

// Modalidades (Secundaria, Adulto CENS, FinES...). Las crea el admin.
export const modalities = sqliteTable("modalities", {
  id: text("id").primaryKey(),
  name: text("name").notNull().unique(),
  isActive: integer("is_active", { mode: "boolean" }).notNull().default(true), // false = oculta en el registro
  createdAt: integer("created_at", { mode: "timestamp" }),
});

// Escuelas: cada una pertenece a UNA modalidad
export const schools = sqliteTable(
  "schools",
  {
    id: text("id").primaryKey(),
    modalityId: text("modality_id").notNull().references(() => modalities.id, { onDelete: "restrict" }),
    name: text("name").notNull(),
    isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
    createdAt: integer("created_at", { mode: "timestamp" }),
  },
  (t) => [uniqueIndex("schools_modality_name_unique").on(t.modalityId, t.name)]
);

// Cursos: cada uno pertenece a UNA escuela. El nombre lo elige el admin ("1ro A", "Comisión 2")
export const courses = sqliteTable(
  "courses",
  {
    id: text("id").primaryKey(),
    schoolId: text("school_id").notNull().references(() => schools.id, { onDelete: "restrict" }),
    name: text("name").notNull(),
    isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
    createdAt: integer("created_at", { mode: "timestamp" }),
  },
  (t) => [uniqueIndex("courses_school_name_unique").on(t.schoolId, t.name)]
);

export const students = sqliteTable(
  "students",
  {
    id: text("id").primaryKey(),
    fullName: text("full_name").notNull(),
    username: text("username").notNull().unique(),
    passwordHash: text("password_hash").notNull(),
    // Texto que escribió el alumno al registrarse. Se conserva como referencia.
    modality: text("modality").notNull(),
    school: text("school").notNull(),
    year: text("year"),
    division: text("division"),
    extraInfo: text("extra_info"),
    // Curso asignado (null = todavía sin asignar)
    courseId: text("course_id").references(() => courses.id, { onDelete: "restrict" }),
    createdAt: integer("created_at", { mode: "timestamp" }),
    // "pendiente" = recién registrado, espera que el profe lo apruebe. "bloqueado" = no puede jugar.
    // El valor por defecto es "aprobado": así quedan los alumnos viejos y los que registre la versión anterior.
    status: text("status", { enum: ["pendiente", "aprobado", "bloqueado"] }).notNull().default("aprobado"),
  },
  (t) => [index("students_status_idx").on(t.status)]
);

// Qué cursos pueden hacer cada quiz (si un curso no está acá, sus alumnos no ven el quiz)
export const quizCourses = sqliteTable(
  "quiz_courses",
  {
    quizId: text("quiz_id").notNull().references(() => quizzes.id, { onDelete: "cascade" }),
    courseId: text("course_id").notNull().references(() => courses.id, { onDelete: "cascade" }),
  },
  (t) => [primaryKey({ columns: [t.quizId, t.courseId] })]
);

// Cada vez que un alumno hace un quiz. El servidor lleva la pregunta actual y la hora
// en que se la mostró, para medir el tiempo sin depender del navegador.
export const attempts = sqliteTable(
  "attempts",
  {
    id: text("id").primaryKey(),
    studentId: text("student_id").notNull().references(() => students.id, { onDelete: "cascade" }),
    quizId: text("quiz_id").notNull().references(() => quizzes.id, { onDelete: "cascade" }),
    number: integer("number").notNull(), // 1 = primer intento, 2 = segundo...
    questionIds: text("question_ids").notNull(), // JSON con el orden de las preguntas al empezar
    currentIndex: integer("current_index").notNull().default(0),
    shownAtMs: integer("shown_at_ms"), // cuándo se mostró la pregunta actual; null = ya la respondió
    startedAt: integer("started_at", { mode: "timestamp_ms" }).notNull(),
    finishedAt: integer("finished_at", { mode: "timestamp_ms" }),
  },
  // Evita que dos pestañas abiertas a la vez creen dos intentos
  (t) => [uniqueIndex("attempts_student_quiz_number_unique").on(t.studentId, t.quizId, t.number)]
);

// Cada respuesta de un intento. chosenIndex null = se le acabó el tiempo.
export const attemptAnswers = sqliteTable(
  "attempt_answers",
  {
    id: text("id").primaryKey(),
    attemptId: text("attempt_id").notNull().references(() => attempts.id, { onDelete: "cascade" }),
    questionId: text("question_id").notNull(),
    chosenIndex: integer("chosen_index"),
    isCorrect: integer("is_correct", { mode: "boolean" }).notNull(),
    elapsedMs: integer("elapsed_ms").notNull(),
    points: integer("points").notNull(), // puntos del ranking (no cambian la nota)
    answeredAt: integer("answered_at", { mode: "timestamp_ms" }).notNull(),
  },
  // Una sola respuesta por pregunta en cada intento
  (t) => [uniqueIndex("attempt_answers_attempt_question_unique").on(t.attemptId, t.questionId)]
);

// Intentos extra que habilitó el admin (cada fila = un intento más)
export const extraAttempts = sqliteTable("extra_attempts", {
  id: text("id").primaryKey(),
  studentId: text("student_id").notNull().references(() => students.id, { onDelete: "cascade" }),
  quizId: text("quiz_id").notNull().references(() => quizzes.id, { onDelete: "cascade" }),
  grantedAt: integer("granted_at", { mode: "timestamp_ms" }).notNull(),
});

// Registro de notas cambiadas a mano por el admin. Cada cambio es una fila nueva (no se pisa nada).
// La que vale es la última: si su grade es null, el admin quitó la edición y vuelve a contar la de los intentos.
export const gradeEdits = sqliteTable(
  "grade_edits",
  {
    id: text("id").primaryKey(),
    studentId: text("student_id").notNull().references(() => students.id, { onDelete: "cascade" }),
    quizId: text("quiz_id").notNull().references(() => quizzes.id, { onDelete: "cascade" }),
    grade: real("grade"), // nota nueva de 0 a 10 (null = se quitó la edición)
    previousGrade: real("previous_grade"), // la nota que contaba justo antes del cambio
    editedBy: text("edited_by").notNull(),
    editedAt: integer("edited_at", { mode: "timestamp_ms" }).notNull(),
  },
  (t) => [index("grade_edits_student_quiz_idx").on(t.studentId, t.quizId)]
);
