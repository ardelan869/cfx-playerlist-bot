import { command } from '@/lib/commands';

import { eq } from 'drizzle-orm';
import {
  getPlayersFromServer,
  getServerInfo,
  type ServerResponse
} from '@/lib/utils/server';

import createCamperResponse from './responses/camper';
import createPlayerResponse from './responses/player';
import createDropResponse from './responses/drop';

import {
  ContainerBuilder,
  MessageFlags,
  SlashCommandBuilder,
  type InteractionReplyOptions,
  type MessagePayload,
  type Awaitable,
  type InteractionEditReplyOptions,
  type MessageReplyOptions,
  type User
} from 'discord.js';

export type SearchContextFollowUp = (
  options: string | MessagePayload | InteractionReplyOptions
) => Awaitable<unknown>;

export interface SearchContext {
  user: User;
  identifier: string;
  query?: string;
  reply: (
    options:
      | string
      | MessagePayload
      | (InteractionEditReplyOptions & MessageReplyOptions)
  ) => Awaitable<unknown>;
  followUp?: SearchContextFollowUp;
}

export async function handleSearch({
  user,
  identifier,
  query,
  reply,
  followUp
}: SearchContext) {
  if (global.dev && user.id !== '852630017404960848') {
    await reply({
      content: 'An mir wird gebaut...'
    });

    return;
  }

  const [server] = await db
    .select({
      id: schema.servers.id,
      identifier: schema.servers.identifier,
      label: schema.servers.label
    })
    .from(schema.servers)
    .where(eq(schema.servers.identifier, identifier))
    .limit(1);

  if (!server) {
    await reply({
      content: 'Server konnte nicht gefunden werden.'
    });

    return;
  }

  let serverInfo: ServerResponse | undefined;

  try {
    serverInfo = await getServerInfo(server.id);

    if (!serverInfo) {
      await reply({
        content: 'Server konnte nicht gefunden werden.'
      });

      return;
    }
  } catch (error) {
    console.error(error);

    await reply({
      content: `Fehler: ${error instanceof Error ? error.message : error}`
    });

    return;
  }

  let players;

  try {
    players = await getPlayersFromServer(server.id);

    if (!players) {
      await reply({
        content: 'Players konnten nicht gefunden werden.'
      });

      return;
    }
  } catch (error) {
    console.error(error);

    await reply({
      content: `Fehler: ${error instanceof Error ? error.message : error}`
    });

    return;
  }

  const container = new ContainerBuilder();

  if (serverInfo.banner_detail)
    container.addMediaGalleryComponents((mediaGallery) =>
      mediaGallery.addItems((m) => m.setURL(serverInfo.banner_detail)).setId(1)
    );

  switch (query) {
    case 'camper':
      createCamperResponse({ container, server, players });
      break;
    case 'drop':
    case 'drops':
      await createDropResponse({ container, server });
      break;
    default:
      createPlayerResponse({ container, server, players, query });
      break;
  }

  container.addTextDisplayComponents((text) =>
    text.setContent('-# @ardelan869')
  );

  if (followUp) {
    await reply({
      content: 'Ergebnisse werden gesendet...'
    });

    await followUp({
      components: [container],
      flags: MessageFlags.IsComponentsV2
    });

    return;
  }

  await reply({
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
        .setRequired(false)
    )
    .setDefaultMemberPermissions(null),
  async (interaction) => {
    await interaction.deferReply({
      flags: 64
    });

    const identifier = interaction.options.getString('identifier', true);
    const query = interaction.options.getString('query', false)?.toLowerCase();

    await handleSearch({
      user: interaction.user,
      identifier,
      query,
      reply: (options) => interaction.editReply(options),
      followUp: (options) => interaction.followUp(options)
    });
  }
);
