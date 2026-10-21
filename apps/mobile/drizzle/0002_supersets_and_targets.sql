ALTER TABLE `routine_exercises` ADD `superset_id` integer;--> statement-breakpoint
ALTER TABLE `routine_sets` ADD `reps_max` integer;--> statement-breakpoint
ALTER TABLE `routine_sets` ADD `duration_seconds` integer;--> statement-breakpoint
ALTER TABLE `routine_sets` ADD `distance_meters` integer;--> statement-breakpoint
ALTER TABLE `workout_exercises` ADD `superset_id` integer;