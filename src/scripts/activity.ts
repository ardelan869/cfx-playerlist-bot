import { ActivityType } from 'discord.js';

export default async function activity() {
  if (!client.user) return;

  const guilds = await client.guilds.fetch();

  client.user.setActivity({
    name: `${guilds.size} Discord Server`,
    state: 'made by ardelan869',
    type: ActivityType.Watching,
    url: 'https://discord.gg/ays2026'
  });
}
