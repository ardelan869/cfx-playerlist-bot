ALTER TABLE "notified_servers" ADD PRIMARY KEY ("server_id");--> statement-breakpoint
ALTER TABLE "notified_servers" ADD CONSTRAINT "notified_servers_server_id_key" UNIQUE("server_id");