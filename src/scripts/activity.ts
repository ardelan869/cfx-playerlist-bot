export const interval = 60000;

export default async function activity() {
  if (!client.user) return;

  const guilds = await client.guilds.fetch();

  client.user.setActivity({
    name: `Auf ${guilds.size} Discord-Servern`,
    state: 'made by ardelan869'
  });
}
