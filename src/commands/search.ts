import { command } from '@/lib/commands';
import { getPingEmoji, isServerResponse } from '@/lib/utils';
import {
  ContainerBuilder,
  MessageFlags,
  SlashCommandBuilder
} from 'discord.js';
import { eq } from 'drizzle-orm';

export default command(
  new SlashCommandBuilder()
    .setName('search')
    .setDescription('Query a string')
    .addStringOption((option) =>
      option
        .setName('identifier')
        .setDescription('The server identifier')
        .setRequired(true)
        .setAutocomplete(true)
    )
    .addStringOption((option) =>
      option
        .setName('query')
        .setDescription('The query string')
        .setRequired(true)
    )
    .setDefaultMemberPermissions(null),
  async (interaction) => {
    await interaction.deferReply({
      flags: 64
    });

    const identifier = interaction.options.getString('identifier', true);
    const query = interaction.options.getString('query', true).toLowerCase();

    const [server] = await db
      .select({
        id: global.schema.servers.id,
        label: global.schema.servers.label
      })
      .from(global.schema.servers)
      .where(eq(global.schema.servers.identifier, identifier));

    if (!server) {
      await interaction.editReply({
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
      await interaction.editReply({
        content: 'Server konnte nicht gefunden werden.'
      });

      return;
    }

    const players = data.Data.players
      .filter((p) => p.name.toLowerCase().includes(query))
      .slice(0, 50);

    const container = new ContainerBuilder();

    if (players.length) {
      container.addTextDisplayComponents((textDisplay) =>
        textDisplay.setContent(`# ${server.label}
## Ergebnisse für: "${query}" (${players.length} Online)
${players
  .sort((a, b) => a.ping - b.ping)
  .map((p) => `${getPingEmoji(p.ping)} **${p.name}** (${p.id}) \`${p.ping}ms\``)
  .join('\n')}`)
      );
    } else {
      container.addTextDisplayComponents((textDisplay) =>
        textDisplay.setContent(`# ${server.label}
## Ergebnisse für: "${query}" (Keine Online)

> Es konnte kein Spieler mit dem Namen "${query}" gefunden werden.`)
      );
    }

    await interaction.editReply({
      content: 'Ergebnisse werden gesendet...'
    });

    await interaction.followUp({
      components: [container],
      flags: MessageFlags.IsComponentsV2
    });
  }
);
