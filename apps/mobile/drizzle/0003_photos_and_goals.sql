CREATE TABLE `workout_photos` (
	`id` text PRIMARY KEY NOT NULL,
	`workout_id` text NOT NULL,
	`uri` text NOT NULL,
	`position` integer DEFAULT 0 NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`workout_id`) REFERENCES `workouts`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `workout_photos_workout_idx` ON `workout_photos` (`workout_id`);--> statement-breakpoint
ALTER TABLE `profile` ADD `weekly_goal` integer DEFAULT 3 NOT NULL;--> statement-breakpoint
ALTER TABLE `profile` ADD `goal_exercise_id` text;--> statement-breakpoint
ALTER TABLE `profile` ADD `goal_weight_kg` real;--> statement-breakpoint
ALTER TABLE `profile` ADD `sounds_enabled` integer DEFAULT true NOT NULL;