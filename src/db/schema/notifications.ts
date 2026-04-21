import { pgTable } from 'drizzle-orm/pg-core';

const notifications = pgTable('notifications', (t) => ({
  id: t.serial('id').primaryKey().unique(),
  message: t.text('message').notNull(),
  attachmentURL: t.text('attachment_url')
}));

export default notifications;
