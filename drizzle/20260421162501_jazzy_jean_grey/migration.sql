CREATE TABLE "notifications" (
	"id" serial PRIMARY KEY UNIQUE,
	"message" text NOT NULL,
	"images" jsonb NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notified_servers" (
	"server_id" text NOT NULL,
	"notified_at" date NOT NULL
);
