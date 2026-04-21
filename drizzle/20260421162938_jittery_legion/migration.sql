ALTER TABLE "notified_servers" RENAME COLUMN "notified_at" TO "last_notify";--> statement-breakpoint
ALTER TABLE "notified_servers" ADD COLUMN "read" jsonb NOT NULL;