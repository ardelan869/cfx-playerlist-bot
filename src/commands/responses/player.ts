import type { ContainerBuilder } from 'discord.js';
import { getPingEmoji, type ServerResponsePlayer } from '@/lib/utils';

export default function createPlayerResponse(
  container: ContainerBuilder,
  server: typeof schema.servers.$inferSelect,
  players: ServerResponsePlayer[],
  query: string
) {
  const parsedQuery = parseInt(query);
  const resemblesNumber =
    !Number.isNaN(parsedQuery) && Number.isSafeInteger(parsedQuery);

  const filteredPlayers = players
    .filter(
      (p) =>
        p.name.toLowerCase().includes(query) ||
        (resemblesNumber && p.id.toString().includes(query))
    )
    .slice(0, 50);

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

  container.addTextDisplayComponents((textDisplay) =>
    textDisplay.setContent(
      `# ${server.label}
## Ergebnisse für: "${query}" (${filteredPlayers.length} Online)
${filteredPlayers
  .sort((a, b) => a.ping - b.ping)
  .map((p) => `${getPingEmoji(p.ping)} **${p.name}** (${p.id}) \`${p.ping}ms\``)
  .join('\n')}`
    )
  );
}
