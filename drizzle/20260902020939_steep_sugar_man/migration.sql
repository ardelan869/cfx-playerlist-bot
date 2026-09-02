DROP TABLE "notifications";--> statement-breakpoint
DROP TABLE "notified_servers";--> statement-breakpoint
ALTER TABLE "servers" ADD COLUMN "aliases" text[] DEFAULT '{}'::text[] NOT NULL;