-- Estructura de la base de producción ANTES de la etapa 2 (sacada de un respaldo, sin datos).
-- Los tests arman la base con esto + scripts/sql/0002 + scripts/sql/0003, igual que pasó en producción.

CREATE TABLE `quizzes` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`description` text,
	`slug` text NOT NULL,
	`icon` text,
	`subject` text,
	`level` text,
	`is_published` integer DEFAULT false,
	`created_at` integer,
	`updated_at` integer
, time_limit integer);
--> statement-breakpoint
CREATE UNIQUE INDEX `quizzes_slug_unique` ON `quizzes` (`slug`);
--> statement-breakpoint
CREATE TABLE `rounds` (
	`id` text PRIMARY KEY NOT NULL,
	`quiz_id` text,
	`name` text NOT NULL,
	`icon` text,
	`description` text,
	`order` integer DEFAULT 0,
	FOREIGN KEY (`quiz_id`) REFERENCES `quizzes`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `questions` (
	`id` text PRIMARY KEY NOT NULL,
	`round_id` text,
	`question` text NOT NULL,
	`question_image` text,
	`options` text NOT NULL,
	`option_images` text,
	`correct_index` integer NOT NULL,
	`explanation` text,
	`order` integer DEFAULT 0,
	FOREIGN KEY (`round_id`) REFERENCES `rounds`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE "scores" (
    `id` text PRIMARY KEY NOT NULL,
    `quiz_id` text,
    `round_id` text,
    `player_name` text,
    `score` integer NOT NULL,
    `total_questions` integer NOT NULL,
    `correct_answers` integer NOT NULL,
    `played_at` integer,
    FOREIGN KEY (`quiz_id`) REFERENCES `quizzes`(`id`) ON UPDATE no action ON DELETE cascade,
    FOREIGN KEY (`round_id`) REFERENCES `rounds`(`id`) ON UPDATE no action ON DELETE cascade
  );
--> statement-breakpoint
CREATE TABLE `students` (
	`id` text PRIMARY KEY NOT NULL,
	`full_name` text NOT NULL,
	`username` text NOT NULL,
	`password_hash` text NOT NULL,
	`modality` text NOT NULL,
	`school` text NOT NULL,
	`year` text,
	`division` text,
	`extra_info` text,
	`created_at` integer
);
--> statement-breakpoint
CREATE UNIQUE INDEX `students_username_unique` ON `students` (`username`);
