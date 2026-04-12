import { pgTable, text } from 'drizzle-orm/pg-core';

const servers = pgTable('servers', {
  id: text('id').notNull().primaryKey(),
  identifier: text('identifier').notNull(),
  label: text('label').notNull()
});

export default servers;
