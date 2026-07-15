import { createButtons } from '@/commands/responses/player';
import { callback } from '@/lib/buttons';
import { MAX_PLAYERS } from '@/lib/constants';
import { getPingEmoji, isContainer } from '@/lib/utils';
import { ComponentType, ContainerBuilder, MessageFlags } from 'discord.js';

export default callback('prev:', async (interaction) => {
  const id = interaction.customId.split(':')[1];

  if (!id || !global.cachedResponses[id]) {
    await interaction.reply({
      content: 'Die Interaktion ist abgelaufen.',
      flags: 64
    });

    return;
  }

  if (!global.currentPageIdx[id]) {
    global.currentPageIdx[id] = 0;
  }

  const maxPages = Math.ceil(global.cachedResponses[id].length / MAX_PLAYERS);

  if (global.currentPageIdx[id] - 1 < 0) {
    interaction.reply({
      content: 'Keine weiteren Seiten vorhanden.',
      flags: 64
    });

    return;
  }

  const page = global.currentPageIdx[id] - 1;

  const container = interaction.message.components[0];

  if (!isContainer(container)) {
    await interaction.reply({
      content: 'Ein Fehler ist aufgetreten. (1)',
      flags: 64
    });

    return;
  }

  const newContainer = new ContainerBuilder();

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
    await interaction.reply({
      content: 'Ein Fehler ist aufgetreten. (2)',
      flags: 64
    });

    return;
  }

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

  const lines = textDisplayComponent.data.content.split('\n');

  const serverLabel = lines[0]!.split('# ')[1];
  const query = lines[1]!.match(/"([^"]*)"/)?.[1]?.replaceAll('"', '');

  global.currentPageIdx[id]--;
  const players = global.cachedResponses[id].slice(
    page * MAX_PLAYERS,
    (page + 1) * MAX_PLAYERS
  );

  newContainer
    .addTextDisplayComponents((textDisplay) =>
      textDisplay
        .setContent(
          `# ${serverLabel}
## Ergebnisse ${query ? `für: "${query} "` : ''}(${global.cachedResponses[id]!.length} Online)
${players
  .slice(0, MAX_PLAYERS)
  .sort((a, b) => a.ping - b.ping)
  .map((p) => `${getPingEmoji(p.ping)} **${p.name}** (${p.id}) \`${p.ping}ms\``)
  .join('\n')}`
        )
        .setId(2)
    )
    .addSeparatorComponents((s) => s)
    .addTextDisplayComponents((text) =>
      text.setContent(`-# Seite ${page + 1}/${maxPages}`)
    )
    .addActionRowComponents((row) =>
      row.addComponents(
        createButtons(
          id,
          page === 0,
          global.cachedResponses[id]!.length <= MAX_PLAYERS ||
            maxPages === page + 1
        )
      )
    )
    .addTextDisplayComponents((text) => text.setContent('-# @ardelan869'));

  await interaction.update({
    components: [newContainer],
    flags: MessageFlags.IsComponentsV2
  });
});
