PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_scores` (
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
INSERT INTO `__new_scores`("id", "quiz_id", "round_id", "player_name", "score", "total_questions", "correct_answers", "played_at") SELECT "id", "quiz_id", "round_id", "player_name", "score", "total_questions", "correct_answers", "played_at" FROM `scores`;--> statement-breakpoint
DROP TABLE `scores`;--> statement-breakpoint
ALTER TABLE `__new_scores` RENAME TO `scores`;--> statement-breakpoint
PRAGMA foreign_keys=ON;