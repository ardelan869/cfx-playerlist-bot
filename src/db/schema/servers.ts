import { pgTable } from 'drizzle-orm/pg-core';

const servers = pgTable('servers', (t) => ({
  id: t.text('id').notNull().primaryKey(),
  identifier: t.text('identifier').notNull().unique(),
  label: t.text('label').notNull()
}));

const drops = pgTable('drops', (t) => ({
  serverId: t
    .text('server_identifier')
    .notNull()
    .references(() => servers.identifier),
  timestamp: t
    .time('timestamp', {
      withTimezone: false
    })
    .notNull(),
  label: t.text('label').notNull()
}));

export { servers, drops };
