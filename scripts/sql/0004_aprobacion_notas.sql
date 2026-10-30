-- Etapa 4: aprobación de alumnos y notas editadas a mano.
-- Solo AGREGA una columna y una tabla. No borra ni modifica datos existentes.
-- Todos los alumnos que ya existen quedan "aprobado" (es el valor por defecto de la columna).
-- La versión anterior de la app sigue funcionando: no conoce la columna, y los alumnos
-- que registre quedan aprobados por el valor por defecto, como siempre.
-- Se aplica con: scripts/aplicar-sql.ts (todo junto, o nada si algo falla).

ALTER TABLE `students` ADD `status` text DEFAULT 'aprobado' NOT NULL;
--> statement-breakpoint
CREATE INDEX `students_status_idx` ON `students` (`status`);
--> statement-breakpoint
CREATE TABLE `grade_edits` (
	`id` text PRIMARY KEY NOT NULL,
	`student_id` text NOT NULL,
	`quiz_id` text NOT NULL,
	`grade` real,
	`previous_grade` real,
	`edited_by` text NOT NULL,
	`edited_at` integer NOT NULL,
	FOREIGN KEY (`student_id`) REFERENCES `students`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`quiz_id`) REFERENCES `quizzes`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `grade_edits_student_quiz_idx` ON `grade_edits` (`student_id`, `quiz_id`);
