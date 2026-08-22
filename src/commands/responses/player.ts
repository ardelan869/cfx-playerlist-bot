import { ButtonBuilder, ButtonStyle, type ContainerBuilder } from 'discord.js';
import { type ServerResponsePlayer } from '@/lib/utils/server';
import { formatPlayerListContent } from '@/lib/utils';
import { createSession } from '@/lib/pagination-store';
import { MAX_PLAYERS } from '@/lib/constants';

export function createButtons(id: string, page: number, maxPages: number) {
  const isFirstPage = page <= 0;
  const isLastPage = page >= maxPages - 1;

  const firstButton = new ButtonBuilder()
    .setCustomId(`first:${id}`)
    .setEmoji('⏮️')
    .setDisabled(isFirstPage)
    .setStyle(ButtonStyle.Secondary);

  const prevButton = new ButtonBuilder()
    .setCustomId(`prev:${id}`)
    .setEmoji('◀️')
    .setDisabled(isFirstPage)
    .setStyle(ButtonStyle.Secondary);

  const nextButton = new ButtonBuilder()
    .setCustomId(`next:${id}`)
    .setEmoji('▶️')
    .setDisabled(isLastPage)
    .setStyle(ButtonStyle.Secondary);

  const lastButton = new ButtonBuilder()
    .setCustomId(`last:${id}`)
    .setEmoji('⏭️')
    .setDisabled(isLastPage)
    .setStyle(ButtonStyle.Secondary);

  return [firstButton, prevButton, nextButton, lastButton];
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

  const id = createSession(filteredPlayers);
  const maxPages = Math.ceil(filteredPlayers.length / MAX_PLAYERS);

  container
    .addTextDisplayComponents((textDisplay) =>
      textDisplay
        .setContent(
          formatPlayerListContent(
            server.label,
            query,
            filteredPlayers.slice(0, MAX_PLAYERS),
            filteredPlayers.length
          )
        )
        .setId(2)
    )
    .addSeparatorComponents((s) => s)
    .addTextDisplayComponents((text) =>
      text.setContent(`-# Seite 1/${maxPages}`)
    )
    .addActionRowComponents((row) =>
      row.addComponents(createButtons(id, 0, maxPages))
    );
}
