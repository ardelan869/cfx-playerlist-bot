import { ButtonBuilder, ButtonStyle, type ContainerBuilder } from 'discord.js';
import { type ServerResponsePlayer } from '@/lib/utils/server';
import { getPingEmoji } from '@/lib/utils';
import { MAX_PLAYERS } from '@/lib/constants';

export function createButtons(
  id: string,
  disablePrevPage: boolean = false,
  disableNextPage: boolean = false
) {
  const prevButton = new ButtonBuilder()
    .setCustomId(`prev:${id}`)
    .setEmoji('◀️')
    .setDisabled(disablePrevPage)
    .setStyle(ButtonStyle.Secondary);

  const nextButton = new ButtonBuilder()
    .setCustomId(`next:${id}`)
    .setEmoji('▶️')
    .setDisabled(disableNextPage)
    .setStyle(ButtonStyle.Secondary);

  return [prevButton, nextButton];
}

export default function createPlayerResponse({
  container,
  server,
  players,
  query
}: {
  container: ContainerBuilder;
  server: typeof schema.servers.$inferSelect;
  players: ServerResponsePlayer[];
  query?: string;
}) {
  query = query?.toLowerCase();

  const filteredPlayers = query
    ? players.filter(
        (p) =>
          p.name.toLowerCase().includes(query) ||
          p.id.toString().includes(query)
      )
    : players;

  if (!filteredPlayers.length) {
    container.addTextDisplayComponents((textDisplay) =>
      textDisplay.setContent(
        `# ${server.label}
## Ergebnisse für: "${query}" (Keine Online)
> Es konnte kein Spieler mit dem Namen "${query}" gefunden werden.`
      )
    );

    return;
  }

  const id = Math.random().toString(36).substring(2, 15);

  global.cachedResponses[id] = filteredPlayers;
  global.currentPageIdx[id] = 0;

  const maxPages = Math.ceil(filteredPlayers.length / MAX_PLAYERS);

  container
    .addTextDisplayComponents((textDisplay) =>
      textDisplay
        .setContent(
          `# ${server.label}
## Ergebnisse ${query ? `für: "${query} "` : ''}(${filteredPlayers.length} Online)
${filteredPlayers
  .slice(0, MAX_PLAYERS)
  .sort((a, b) => a.ping - b.ping)
  .map((p) => `${getPingEmoji(p.ping)} **${p.name}** (${p.id}) \`${p.ping}ms\``)
  .join('\n')}`
        )
        .setId(2)
    )
    .addSeparatorComponents((s) => s)
    .addTextDisplayComponents((text) =>
      text.setContent(`-# Seite 1/${maxPages}`)
    )
    .addActionRowComponents((row) =>
      row.addComponents(
        createButtons(id, true, filteredPlayers.length <= MAX_PLAYERS)
      )
    );

  // FIXME: make a better solution
  // Actually improve everything, shitty code - ardelan
  setTimeout(() => {
    delete global.cachedResponses[id];
    delete global.currentPageIdx[id];
  }, 5 * 60000);
}
