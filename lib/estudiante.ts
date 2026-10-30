import { cookies } from "next/headers";

// Id del alumno logueado (o null si juega sin cuenta)
export async function alumnoLogueado() {
  const cookieStore = await cookies();
  return cookieStore.get("student_id")?.value || null;
}
