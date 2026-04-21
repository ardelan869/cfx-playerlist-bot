import { pgTable } from 'drizzle-orm/pg-core';

const notifiedServers = pgTable('notified_servers', (t) => ({
  serverId: t.text('server_id').notNull(),
  lastNotify: t.date('last_notify', { mode: 'date' }).notNull(),
  read: t.jsonb('read').notNull()
}));

export default notifiedServers;
