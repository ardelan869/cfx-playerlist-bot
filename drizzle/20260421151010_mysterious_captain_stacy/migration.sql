CREATE SCHEMA IF NOT EXISTS "public";

CREATE TABLE "drops" (
	"server_identifier" text NOT NULL,
	"timestamp" time NOT NULL,
	"label" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "servers" (
	"id" text PRIMARY KEY,
	"identifier" text NOT NULL UNIQUE,
	"label" text NOT NULL
);
--> statement-breakpoint
ALTER TABLE "drops" ADD CONSTRAINT "drops_server_identifier_servers_identifier_fkey" FOREIGN KEY ("server_identifier") REFERENCES "servers"("identifier");
