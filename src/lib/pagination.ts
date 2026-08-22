import { createButtons } from '@/commands/responses/player';
import { MAX_PLAYERS } from '@/lib/constants';
import { getSession, touchSession } from '@/lib/pagination-store';
import { formatPlayerListContent, isContainer } from '@/lib/utils';
import {
  ComponentType,
  ContainerBuilder,
  MessageFlags,
  type ButtonInteraction
} from 'discord.js';

const MESSAGES = {
  expired: 'Die Interaktion ist abgelaufen.',
  busy: 'Die vorherige Änderung wird noch verarbeitet, bitte warten.',
  noMorePages: 'Keine weiteren Seiten vorhanden.',
  brokenContainer: 'Ein Fehler ist aufgetreten. (1)',
  brokenTextDisplay: 'Ein Fehler ist aufgetreten. (2)'
} as const;

async function replyEphemeral(interaction: ButtonInteraction, content: string) {
  await interaction.reply({ content, flags: 64 });
}

export type TargetPage =
  | number
  | ((currentPage: number, maxPages: number) => number);

export async function changePage(
  interaction: ButtonInteraction,
  targetPage: TargetPage
) {
  const id = interaction.customId.split(':')[1];
  const session = id ? getSession(id) : undefined;

  if (!id || !session) {
    await replyEphemeral(interaction, MESSAGES.expired);
    return;
  }

  if (session.locked) {
    await replyEphemeral(interaction, MESSAGES.busy);
    return;
  }

  const maxPages = Math.ceil(session.players.length / MAX_PLAYERS);
  const page =
    typeof targetPage === 'function'
      ? targetPage(session.page, maxPages)
      : targetPage;

  if (page < 0 || page >= maxPages || page === session.page) {
    await replyEphemeral(interaction, MESSAGES.noMorePages);
    return;
  }

  const container = interaction.message.components[0];

  if (!isContainer(container)) {
    await replyEphemeral(interaction, MESSAGES.brokenContainer);
    return;
  }

  let mediaComponent, textDisplayComponent;

  for (const component of container.components) {
    if (component.id === 2 && component.type === ComponentType.TextDisplay) {
      textDisplayComponent = component;
    } else if (
      component.id === 1 &&
      component.type === ComponentType.MediaGallery
    ) {
      mediaComponent = component;
    }
  }

  if (!textDisplayComponent) {
    await replyEphemeral(interaction, MESSAGES.brokenTextDisplay);
    return;
  }

  session.locked = true;

  try {
    const [headerLine, resultsLine] =
      textDisplayComponent.data.content.split('\n');
    const serverLabel = headerLine!.split('# ')[1]!;
    const query = resultsLine!.match(/"([^"]*)"/)?.[1]?.replaceAll('"', '');

    const players = session.players.slice(
      page * MAX_PLAYERS,
      (page + 1) * MAX_PLAYERS
    );

    const newContainer = new ContainerBuilder();

    if (
      mediaComponent &&
      mediaComponent.type === ComponentType.MediaGallery &&
      typeof mediaComponent.items[0]?.media.data.url === 'string'
    ) {
      newContainer.addMediaGalleryComponents((mediaGallery) =>
        mediaGallery
          .addItems((m) =>
            m.setURL(mediaComponent.items[0]?.media.data.url as string)
          )
          .setId(1)
      );
    }

    newContainer
      .addTextDisplayComponents((textDisplay) =>
        textDisplay
          .setContent(
            formatPlayerListContent(
              serverLabel,
              query,
              players,
              session.players.length
            )
          )
          .setId(2)
      )
      .addSeparatorComponents((s) => s)
      .addTextDisplayComponents((text) =>
        text.setContent(`-# Seite ${page + 1}/${maxPages}`)
      )
      .addActionRowComponents((row) =>
        row.addComponents(createButtons(id, page, maxPages))
      )
      .addTextDisplayComponents((text) => text.setContent('-# @ardelan869'));

    session.page = page;
    touchSession(id);

    await interaction.update({
      components: [newContainer],
      flags: MessageFlags.IsComponentsV2
    });
  } finally {
    session.locked = false;
  }
}
