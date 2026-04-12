import { command } from '@/lib/commands';
import { SlashCommandBuilder } from 'discord.js';
import { eq } from 'drizzle-orm';

export default command(
  new SlashCommandBuilder()
    .setName('server')
    .setDescription('Add a server to the database')
    .addSubcommand((subcommand) =>
      subcommand
        .setName('add')
        .setDescription('Add a server to the database')
        .addStringOption((option) =>
          option
            .setName('identifier')
            .setDescription('The server identifier')
            .setRequired(true)
        )
        .addStringOption((option) =>
          option
            .setName('server')
            .setDescription('The CFX Server ID')
            .setRequired(true)
        )
        .addStringOption((option) =>
          option
            .setName('label')
            .setDescription('The label for the server')
            .setRequired(true)
        )
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName('remove')
        .setDescription('Remove a server from the database')
        .addStringOption((option) =>
          option
            .setName('server')
            .setDescription('The CFX Server ID')
            .setRequired(true)
        )
    )
    .addSubcommand((subcommand) =>
      subcommand.setName('list').setDescription('List all servers')
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

    switch (command) {
      case 'add': {
        const id = interaction.options.getString('server', true);
        const identifier = interaction.options.getString('identifier', true);
        const label = interaction.options.getString('label', true);

        const [result] = await db
          .select({
            id: global.schema.servers.id
          })
          .from(global.schema.servers)
          .where(eq(global.schema.servers.id, id));

        if (result?.id) {
          await interaction.editReply({
            content: 'Server bereits eingetragen.'
          });

          return;
        }

        await db.insert(global.schema.servers).values({
          id,
          identifier,
          label
        });

        await interaction.editReply({
          content: 'Server erfolgreich eingetragen!'
        });

        break;
      }
      case 'remove': {
        const id = interaction.options.getString('server', true);

        const [result] = await db
          .select({ id: global.schema.servers.id })
          .from(global.schema.servers)
          .where(eq(global.schema.servers.id, id));

        if (!result?.id) {
          await interaction.editReply({
            content: 'Server konnte nicht gefunden werden.'
          });

          return;
        }

        await db
          .delete(global.schema.servers)
          .where(eq(global.schema.servers.id, id));

        await interaction.editReply({
          content: 'Server erfolgreich entfernt!'
        });

        break;
      }
      case 'list': {
        const servers = await db
          .select({
            id: global.schema.servers.id,
            identifier: global.schema.servers.identifier,
            label: global.schema.servers.label
          })
          .from(global.schema.servers);

        await interaction.editReply({
          content: servers
            .map(
              (server) =>
                `**${server.label}** (${server.identifier}) \`${server.id}\``
            )
            .join('\n')
        });

        break;
      }
    }
  }
);
