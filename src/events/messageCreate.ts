import { event } from '@/lib/events';
import { isServerResponse } from '@/lib/utils';
import { ContainerBuilder, MessageFlags } from 'discord.js';
import { eq } from 'drizzle-orm';

export default event('messageCreate', async (message) => {
  if (message.author.bot) return;

  const channel = message.channel;

  if (!channel.isSendable() || !message.content.startsWith('!')) return;

  const args = message.content.replace('!', '').trim().split(' ');

  if (args.length < 2) {
    message.reply({
      content: `Nutzung: **!<identifier> <query>**
Beispiel: **!fc saints**`
    });

    return;
  }

  const identifier = args[0];
  const query = args.slice(1).join(' ');

  const [server] = await db
    .select({
      id: global.schema.servers.id,
      label: global.schema.servers.label
    })
    .from(global.schema.servers)
    .where(eq(global.schema.servers.identifier, identifier!));

  if (!server) {
    message.reply({
      content: 'Server konnte nicht gefunden werden.'
    });

    return;
  }

  const resp = await fetch(
    `https://frontend.cfx-services.net/api/servers/single/${server.id}`,
    {
      method: 'GET',
      headers: {
        Referer: 'https://servers.fivem.net/',
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36'
      }
    }
  );

  const data = await resp.json();

  if (!isServerResponse(data)) {
    message.reply({
      content: 'Server konnte nicht gefunden werden.'
    });

    return;
  }

  const players = data.Data.players
    .filter((p) => p.name.toLowerCase().includes(query))
    .slice(50);

  const container = new ContainerBuilder();

  if (players.length) {
    container.addTextDisplayComponents((textDisplay) =>
      textDisplay.setContent(`# ${server.label}
## Ergebnisse für: "${query}" (${players.length} Online)
${players.map((p) => `- **${p.name}** (${p.id}) \`${p.ping}ms\``).join('\n')}`)
    );
  } else {
    container.addTextDisplayComponents((textDisplay) =>
      textDisplay.setContent(`# ${server.label}
## Ergebnisse für: "${query}" (Keine Online)

> Es konnte kein Spieler mit dem Namen "${query}" gefunden werden.`)
    );
  }

  await channel.send({
    components: [container],
    flags: MessageFlags.IsComponentsV2
  });
});
