export default async function loadNotifications() {
  const notifications = await db.select().from(schema.notifications);

  global.notifications = notifications;
}
