-- Etapa 2: modalidades, escuelas y cursos.
-- Solo AGREGA tablas y una columna vacía. No borra ni modifica datos existentes.
-- Se aplica con: scripts/aplicar-sql.ts (todo junto, o nada si algo falla).

CREATE TABLE `modalities` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`is_active` integer DEFAULT true NOT NULL,
	`created_at` integer
);
--> statement-breakpoint
CREATE UNIQUE INDEX `modalities_name_unique` ON `modalities` (`name`);
--> statement-breakpoint
CREATE TABLE `schools` (
	`id` text PRIMARY KEY NOT NULL,
	`modality_id` text NOT NULL,
	`name` text NOT NULL,
	`is_active` integer DEFAULT true NOT NULL,
	`created_at` integer,
	FOREIGN KEY (`modality_id`) REFERENCES `modalities`(`id`) ON UPDATE no action ON DELETE restrict
);
--> statement-breakpoint
CREATE UNIQUE INDEX `schools_modality_name_unique` ON `schools` (`modality_id`,`name`);
--> statement-breakpoint
CREATE TABLE `courses` (
	`id` text PRIMARY KEY NOT NULL,
	`school_id` text NOT NULL,
	`name` text NOT NULL,
	`is_active` integer DEFAULT true NOT NULL,
	`created_at` integer,
	FOREIGN KEY (`school_id`) REFERENCES `schools`(`id`) ON UPDATE no action ON DELETE restrict
);
--> statement-breakpoint
CREATE UNIQUE INDEX `courses_school_name_unique` ON `courses` (`school_id`,`name`);
--> statement-breakpoint
ALTER TABLE `students` ADD `course_id` text REFERENCES courses(id) ON DELETE restrict;
