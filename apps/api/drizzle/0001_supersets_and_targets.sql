ALTER TABLE "routine_exercises" ADD COLUMN "superset_id" integer;--> statement-breakpoint
ALTER TABLE "routine_sets" ADD COLUMN "reps_max" integer;--> statement-breakpoint
ALTER TABLE "routine_sets" ADD COLUMN "duration_seconds" integer;--> statement-breakpoint
ALTER TABLE "routine_sets" ADD COLUMN "distance_meters" integer;--> statement-breakpoint
ALTER TABLE "workout_exercises" ADD COLUMN "superset_id" integer;