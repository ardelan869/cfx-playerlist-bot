import { command } from '@/lib/commands';
import loadNotifications from '@/scripts/load-notifications';
import { SlashCommandBuilder } from 'discord.js';
import { eq } from 'drizzle-orm';

export default command(
  new SlashCommandBuilder()
    .setName('drop')
    .setDescription('Manage drops')
    .addSubcommand((subcommand) =>
      subcommand
        .setName('add')
        .setDescription('Add a drop to the database')
        .addStringOption((option) =>
          option
            .setName('identifier')
            .setDescription('The server identifier')
            .setRequired(true)
        )
        .addStringOption((option) =>
          option
            .setName('timestamp')
            .setDescription('The timestamp of the drop')
            .setRequired(true)
        )
        .addStringOption((option) =>
          option
            .setName('label')
            .setDescription('The label for the drop')
            .setRequired(true)
        )
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName('clear')
        .setDescription('Clear all drops')
        .addStringOption((option) =>
          option
            .setName('identifier')
            .setDescription('The server identifier')
            .setRequired(true)
        )
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName('list')
        .setDescription('List all drops')
        .addStringOption((option) =>
          option
            .setName('identifier')
            .setDescription('The server identifier')
            .setRequired(true)
        )
    )
    .setDefaultMemberPermissions(null),
  async (interaction) => {
    await interaction.deferReply({
      flags: 64
    });

    const user = interaction.user.id;

    // FIXME: hardcode it for now
    if (user !== '852630017404960848') {
      await interaction.editReply({
        content: 'Du bist nicht berechtigt, diesen Befehl zu verwenden.'
      });

      return;
    }

    const command = interaction.options.getSubcommand();

    if (command === 'list') {
      const drops = await db
        .select({
          serverId: schema.drops.serverId,
          timestamp: schema.drops.timestamp,
          label: schema.drops.label
        })
        .from(schema.drops);
      const dropsByServer = drops.reduce(
        (acc, drop) => {
          if (!acc[drop.serverId]) acc[drop.serverId] = [];

          acc[drop.serverId]!.push(drop);

          return acc;
        },
        {} as Record<string, typeof drops>
      );

      await interaction.editReply({
        content: Object.entries(dropsByServer)
          .map(
            ([serverId, drops]) =>
              `**${serverId}** (${drops.length} Drops)
${drops.map((drop) => `\`${drop.timestamp}\` - ${drop.label}`).join('\n')}`
          )
          .join('\n')
      });

      return;
    }

    const identifier = interaction.options.getString('identifier', true);

    const [server] = await db
      .select({
        id: schema.servers.id
      })
      .from(schema.servers)
      .where(eq(schema.servers.identifier, identifier));

    if (!server?.id) {
      await interaction.editReply({
        content: 'Server konnte nicht gefunden werden.'
      });

      return;
    }

    switch (command) {
      case 'add': {
        const timestamp = interaction.options.getString('timestamp', true);
        const label = interaction.options.getString('label', true);

        await db.insert(schema.drops).values({
          serverId: identifier,
          timestamp: timestamp,
          label
        });

        await interaction.editReply({
          content: 'Drop erfolgreich eingetragen!'
        });

        break;
      }
      case 'clear': {
        await db
          .delete(schema.drops)
          .where(eq(schema.drops.serverId, identifier));

        await interaction.editReply({
          content: 'Drop(s) erfolgreich gelöscht!'
        });

        break;
      }
    }

    await loadNotifications();
  }
);
