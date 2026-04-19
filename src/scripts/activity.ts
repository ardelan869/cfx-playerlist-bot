export const interval = 60000;

export default async function activity() {
  if (!client.user) return;

  const guilds = await client.guilds.fetch();

  client.user.setActivity({
    name: `On ${guilds.size} Servers`,
    state: 'made by ardelan869',
    url: 'https://discord.gg/ays2026'
  });
}
