import type { ContainerBuilder } from 'discord.js';
import { eq } from 'drizzle-orm';

export default async function createDropResponse(
  container: ContainerBuilder,
  server: typeof schema.servers.$inferSelect
) {
  const drops = await db
    .select({
      timestamp: schema.drops.timestamp,
      label: schema.drops.label
    })
    .from(schema.drops)
    .where(eq(schema.drops.serverId, server.identifier));

  if (!drops.length) {
    container.addTextDisplayComponents((textDisplay) =>
      textDisplay.setContent(
        `# ${server.label}
## Gefundene Lootdrops (Keine gefunden)
> Es konnte keine Lootdrops gefunden werden.`
      )
    );

    return;
  }

  container.addTextDisplayComponents((textDisplay) =>
    textDisplay.setContent(
      `# ${server.label}
## Gefundene Lootdrops (${drops.length} gefunden)
${drops
  .sort((a, b) => a.timestamp.localeCompare(b.timestamp))
  .map((drop) => `\`${drop.timestamp.slice(0, 5)}\` - **${drop.label}**`)
  .join('\n')}`
    )
  );
}
