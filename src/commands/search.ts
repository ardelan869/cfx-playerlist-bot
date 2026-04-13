import { command } from '@/lib/commands';
import { getPingEmoji, getCountEmoji, isServerResponse } from '@/lib/utils';
import {
  ButtonStyle,
  ContainerBuilder,
  InteractionReplyOptions,
  MessageFlags,
  MessagePayload,
  SlashCommandBuilder,
  type Awaitable,
  type InteractionEditReplyOptions,
  type MessageReplyOptions
} from 'discord.js';
import { eq } from 'drizzle-orm';

const MIN_COUNT_THRESHOLD = 5;

export interface SearchContext {
  identifier: string;
  query: string;

  reply: (
    options:
      | string
      | MessagePayload
      | (InteractionEditReplyOptions & MessageReplyOptions)
  ) => Awaitable<unknown>;
  followUp?: (
    options: string | MessagePayload | InteractionReplyOptions
  ) => Awaitable<unknown>;
}

export async function handleSearch(ctx: SearchContext) {
  const { identifier, query, reply, followUp } = ctx;

  const [server] = await db
    .select({
      id: global.schema.servers.id,
      label: global.schema.servers.label
    })
    .from(global.schema.servers)
    .where(eq(global.schema.servers.identifier, identifier));

  if (!server) {
    return reply({
      content: 'Server konnte nicht gefunden werden.'
    });
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
    return reply({
      content: 'Server konnte nicht gefunden werden.'
    });
  }

  const container = new ContainerBuilder().addMediaGalleryComponents(
    (mediaGallery) =>
      mediaGallery.addItems((m) =>
        m.setURL(data.Data.vars.banner_connecting ?? config.banner)
      )
  );

  if (query === 'camper') {
    const wordCount: Record<string, number> = {};

    for (const player of data.Data.players) {
      const split = player.name
        .replaceAll(/[-_[\]{}()*+?.,\\^$|#/]/g, ' ')
        .split(' ');

      for (let word of split) {
        word = word.toLowerCase();

        if (word.length < 3) continue;

        if (word in wordCount) {
          wordCount[word]!++;
        } else {
          for (const key in wordCount) {
            if (word.startsWith(key)) {
              wordCount[key]!++;
              break;
            }
          }

          wordCount[word] = 1;
        }
      }
    }

    const entries = Object.entries(wordCount)
      .filter(
        ([word, count]) => count >= MIN_COUNT_THRESHOLD && word !== 'zivi'
      )
      .sort((a, b) => b[1] - a[1]);

    const convertName = (name: string) =>
      name.length <= 4
        ? name.toUpperCase()
        : name.replace(name[0]!, name[0]!.toUpperCase());

    container.addTextDisplayComponents((textDisplay) =>
      textDisplay.setContent(
        `# ${server.label}
## Gefundene Camper (${entries.length > 0 ? entries.length : 'Keine'} gefunden)
${
  entries.length
    ? entries
        .map(
          ([word, count]) =>
            `${getCountEmoji(count)} **${convertName(word)}:** \`${count}\``
        )
        .join('\n')
    : `> Es konnte keine Camper  gefunden werden.`
}`
      )
    );
  } else {
    const parsedQuery = parseInt(query);
    const resemblesNumber =
      !Number.isNaN(parsedQuery) && Number.isSafeInteger(parsedQuery);

    const players = data.Data.players
      .filter(
        (p) =>
          p.name.toLowerCase().includes(query) ||
          (resemblesNumber && p.id.toString().includes(query))
      )
      .slice(0, 50);

    container.addTextDisplayComponents((textDisplay) =>
      textDisplay.setContent(
        `# ${server.label}
## Ergebnisse für: "${query}" (${players.length > 0 ? players.length : 'Keine'} Online)
${
  players.length
    ? players
        .sort((a, b) => a.ping - b.ping)
        .map(
          (p) =>
            `${getPingEmoji(p.ping)} **${p.name}** (${p.id}) \`${p.ping}ms\``
        )
        .join('\n')
    : `> Es konnte kein Spieler mit dem Namen "${query}" gefunden werden.`
}`
      )
    );
  }

  container
    .addSeparatorComponents((s) => s)
    .addSectionComponents((section) =>
      section
        .addTextDisplayComponents((text) =>
          text.setContent(`Erstellt von Ardelan Y.
-# @ardelan869`)
        )
        .setButtonAccessory((button) =>
          button
            .setEmoji({
              name: '🔗'
            })
            .setLabel('・ AYS 2026')
            .setURL('https://discord.gg/ays2026')
            .setStyle(ButtonStyle.Link)
        )
    );

  if (followUp) {
    await reply({
      content: 'Ergebnisse werden gesendet...'
    });

    return followUp({
      components: [container],
      flags: MessageFlags.IsComponentsV2
    });
  }

  return reply({
    components: [container],
    flags: MessageFlags.IsComponentsV2
  });
}

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

    await handleSearch({
      identifier,
      query,
      reply: (options) => interaction.editReply(options),
      followUp: (options) => interaction.followUp(options)
    });
  }
);
