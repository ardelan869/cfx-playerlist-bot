import type { ContainerBuilder } from 'discord.js';
import { getCountEmoji, type ServerResponsePlayer } from '@/lib/utils';

const MIN_COUNT_THRESHOLD = 5;

export default function createCamperResponse(
  container: ContainerBuilder,
  server: typeof schema.servers.$inferSelect,
  players: ServerResponsePlayer[]
) {
  const wordCount: Record<string, number> = {};

  for (const player of players) {
    const split = player.name
      .replaceAll(/[-_[\]{}()*+?.,\\^$|#/]/g, ' ')
      .split(' ');

    for (let word of split) {
      word = word.toLowerCase();

      if (word.length < 3) continue;

      if (word in wordCount) {
        wordCount[word]!++;
        break;
      } else {
        for (const key in wordCount) {
          if (word.startsWith(key)) {
            wordCount[key]!++;
            break;
          }
        }

        wordCount[word] = 1;
        break;
      }
    }
  }

  const entries = Object.entries(wordCount)
    .filter(([word, count]) => count >= MIN_COUNT_THRESHOLD && word !== 'zivi')
    .sort((a, b) => b[1] - a[1]);

  if (!entries.length) {
    container.addTextDisplayComponents((textDisplay) =>
      textDisplay.setContent(
        `# ${server.label}
## Gefundene Camper (Keine gefunden)
> Es konnte keine Camper gefunden werden.`
      )
    );

    return;
  }

  const convertName = (name: string) =>
    name.length <= 4
      ? name.toUpperCase()
      : name.replace(name[0]!, name[0]!.toUpperCase());

  container.addTextDisplayComponents((textDisplay) =>
    textDisplay.setContent(
      `# ${server.label}
## Gefundene Camper (${entries.length} gefunden)
${entries
  .map(
    ([word, count]) =>
      `${getCountEmoji(count)} **${convertName(word)}:** \`${count}\``
  )
  .join('\n')}`
    )
  );
}
