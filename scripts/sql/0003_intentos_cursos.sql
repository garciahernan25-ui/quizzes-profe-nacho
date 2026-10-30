-- Etapa 3: intentos, ranking y quizzes por curso.
-- Solo AGREGA tablas y una columna vacía. No borra ni modifica datos existentes.
-- La versión anterior de la app sigue funcionando con esta base (no usa nada de esto).
-- Se aplica con: scripts/aplicar-sql.ts (todo junto, o nada si algo falla).

CREATE TABLE `quiz_courses` (
	`quiz_id` text NOT NULL,
	`course_id` text NOT NULL,
	PRIMARY KEY(`quiz_id`, `course_id`),
	FOREIGN KEY (`quiz_id`) REFERENCES `quizzes`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`course_id`) REFERENCES `courses`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `attempts` (
	`id` text PRIMARY KEY NOT NULL,
	`student_id` text NOT NULL,
	`quiz_id` text NOT NULL,
	`number` integer NOT NULL,
	`question_ids` text NOT NULL,
	`current_index` integer DEFAULT 0 NOT NULL,
	`shown_at_ms` integer,
	`started_at` integer NOT NULL,
	`finished_at` integer,
	FOREIGN KEY (`student_id`) REFERENCES `students`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`quiz_id`) REFERENCES `quizzes`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `attempts_student_quiz_number_unique` ON `attempts` (`student_id`,`quiz_id`,`number`);
--> statement-breakpoint
CREATE TABLE `attempt_answers` (
	`id` text PRIMARY KEY NOT NULL,
	`attempt_id` text NOT NULL,
	`question_id` text NOT NULL,
	`chosen_index` integer,
	`is_correct` integer NOT NULL,
	`elapsed_ms` integer NOT NULL,
	`points` integer NOT NULL,
	`answered_at` integer NOT NULL,
	FOREIGN KEY (`attempt_id`) REFERENCES `attempts`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `attempt_answers_attempt_question_unique` ON `attempt_answers` (`attempt_id`,`question_id`);
--> statement-breakpoint
CREATE TABLE `extra_attempts` (
	`id` text PRIMARY KEY NOT NULL,
	`student_id` text NOT NULL,
	`quiz_id` text NOT NULL,
	`granted_at` integer NOT NULL,
	FOREIGN KEY (`student_id`) REFERENCES `students`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`quiz_id`) REFERENCES `quizzes`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
ALTER TABLE `scores` ADD `attempt_id` text;
--> statement-breakpoint
-- Para que el día del cambio nadie se quede sin quizzes: cada quiz publicado
-- queda habilitado para todos los cursos. Después se saca lo que no corresponda.
INSERT INTO `quiz_courses` (`quiz_id`, `course_id`)
SELECT `quizzes`.`id`, `courses`.`id` FROM `quizzes` CROSS JOIN `courses` WHERE `quizzes`.`is_published` = 1;
