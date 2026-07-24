export const interval = 60000;

export default async function activity() {
  if (!client.user) return;

  const guilds = await client.guilds.fetch();

  let totalMembers = 0;

  for (const cachedGuild of guilds.values()) {
    const guild = await cachedGuild.fetch();

    if (!guild) continue;

    totalMembers += guild.memberCount;
  }

  client.user.setActivity({
    name: `Auf ${guilds.size} Discord-Servern. Erreicht ${totalMembers} Mitglieder.`,
    state: 'made by ardelan869'
  });
}
