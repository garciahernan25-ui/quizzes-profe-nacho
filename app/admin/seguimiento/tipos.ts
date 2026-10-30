// Lo que devuelve /api/seguimiento (lo usan la pantalla de seguimiento y la de asignar)
export type Alumno = {
  id: string;
  fullName: string;
  username: string;
  courseId: string | null;
  bloqueado: boolean;
  textoOriginal: string;
  editadas: string[]; // quizzes con la nota editada a mano
  cantQuizzes: number;
  promedio: number | null;
  porQuiz: Record<string, number>;
};

export type Curso = {
  id: string;
  name: string;
  isActive: boolean;
  schoolId: string;
  escuela: string;
  modalidad: string;
};

export type DatosSeguimiento = {
  alumnos: Alumno[];
  cursos: Curso[];
  quizzes: { id: string; title: string }[];
};

export function nombreCurso(c: Curso) {
  return `${c.modalidad} · ${c.escuela} · ${c.name}`;
}

export function colorNota(nota: number) {
  if (nota >= 7) return "var(--success)";
  if (nota >= 5) return "var(--warning)";
  return "var(--danger)";
}
