CREATE TABLE "import_namespaces" (
	"user_id" text PRIMARY KEY NOT NULL,
	"namespace" uuid DEFAULT gen_random_uuid() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "import_namespaces" ADD CONSTRAINT "import_namespaces_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;