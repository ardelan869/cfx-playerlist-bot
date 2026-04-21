import { command } from '@/lib/commands';

import { eq } from 'drizzle-orm';
import { isServerResponse } from '@/lib/utils';

import createCamperResponse from './responses/camper';
import createPlayerResponse from './responses/player';
import createDropResponse from './responses/drop';

import {
  ContainerBuilder,
  MessageFlags,
  SlashCommandBuilder,
  type Guild,
  type InteractionReplyOptions,
  type MessageCreateOptions,
  type MessagePayload,
  type Awaitable,
  type InteractionEditReplyOptions,
  type MessageReplyOptions
} from 'discord.js';

export type SearchContextFollowUp = (
  options: string | MessagePayload | InteractionReplyOptions
) => Awaitable<unknown>;

export type SearchContextSend = (
  options: string | MessagePayload | MessageCreateOptions
) => Awaitable<unknown>;

export interface SearchContext {
  identifier: string;
  query: string;
  guild: Guild | null;
  reply: (
    options:
      | string
      | MessagePayload
      | (InteractionEditReplyOptions & MessageReplyOptions)
  ) => Awaitable<unknown>;
  followUp?: SearchContextFollowUp;
  send?: SearchContextSend;
}

function isValidArray(value: unknown): value is (string | number)[] {
  return (
    Array.isArray(value) &&
    value.every((v) => typeof v === 'string' || typeof v === 'number')
  );
}

async function notify(
  guild: Guild,
  followUp?: SearchContextFollowUp,
  send?: SearchContextSend
) {
  const now = new Date();

  let [notifiedServer] = await db
    .select({
      read: schema.notifiedServers.read
    })
    .from(schema.notifiedServers)
    .where(eq(schema.notifiedServers.serverId, guild.id))
    .limit(1);

  if (!notifiedServer) {
    await db.insert(schema.notifiedServers).values({
      serverId: guild.id,
      lastNotify: now,
      read: []
    });

    notifiedServer = {
      read: []
    };
  }

  const read = isValidArray(notifiedServer?.read) ? notifiedServer.read : [];
  const originalLength = read.length;

  for (const notification of global.notifications) {
    if (read.includes(notification.id)) continue;

    read.push(notification.id);

    const container = new ContainerBuilder().addTextDisplayComponents((text) =>
      text.setContent(notification.message)
    );

    if (notification.attachmentURL) {
      container.addMediaGalleryComponents((m) =>
        m.addItems((i) => i.setURL(notification.attachmentURL!))
      );
    }

    const message = {
      components: [container],
      flags: MessageFlags.IsComponentsV2 as number
    };

    if (followUp) await followUp(message);
    if (send) await send(message);
  }

  if (originalLength !== read.length) {
    await db
      .update(schema.notifiedServers)
      .set({ read })
      .where(eq(schema.notifiedServers.serverId, guild.id));
  }
}

export async function handleSearch({
  identifier,
  query,
  guild,
  reply,
  followUp,
  send
}: SearchContext) {
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
    await reply({
      content: 'Server konnte nicht gefunden werden.'
    });

    return;
  }

  const container = new ContainerBuilder();

  if (data.Data.vars.banner_connecting)
    container.addMediaGalleryComponents((mediaGallery) =>
      mediaGallery.addItems((m) => m.setURL(data.Data.vars.banner_connecting!))
    );

  switch (query) {
    case 'camper':
      createCamperResponse(container, server, data.Data.players);
      break;
    case 'drop':
    case 'drops':
      await createDropResponse(container, server);
      break;
    default:
      createPlayerResponse(container, server, data.Data.players, query);
      break;
  }

  container
    .addSeparatorComponents((s) => s)
    .addTextDisplayComponents((text) =>
      text.setContent(`Erstellt von Ardelan Y.
-# @ardelan869`)
    );

  if (followUp) {
    await reply({
      content: 'Ergebnisse werden gesendet...'
    });

    await followUp({
      components: [container],
      flags: MessageFlags.IsComponentsV2
    });

    if (guild && notifications.length) {
      await notify(guild, followUp, send);
    }

    return;
  }

  await reply({
    components: [container],
    flags: MessageFlags.IsComponentsV2
  });

  if (guild && notifications.length) {
    await notify(guild, followUp, send);
  }
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
      guild: interaction.guild,
      reply: (options) => interaction.editReply(options),
      followUp: (options) => interaction.followUp(options)
    });
  }
);
