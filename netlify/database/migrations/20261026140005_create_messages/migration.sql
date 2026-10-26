CREATE TABLE "messages" (
	"id" serial PRIMARY KEY,
	"user_id" text NOT NULL,
	"author" text NOT NULL,
	"body" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "messages_created_at_idx" ON "messages" ("created_at");