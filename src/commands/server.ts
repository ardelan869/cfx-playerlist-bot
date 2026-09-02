import { command } from '@/lib/commands';
import { SlashCommandBuilder } from 'discord.js';
import { eq, inArray } from 'drizzle-orm';

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
    .addSubcommand((subcommand) =>
      subcommand
        .setName('alias')
        .setDescription('Add one or more aliases to a server')
        .addStringOption((option) =>
          option
            .setName('identifier')
            .setDescription('The server identifier')
            .setRequired(true)
            .setAutocomplete(true)
        )
        .addStringOption((option) =>
          option
            .setName('aliases')
            .setDescription('Alias(es) to add, separated by spaces or commas')
            .setRequired(true)
        )
    )
    .setDefaultMemberPermissions(null),
  async (interaction) => {
    await interaction.deferReply({
      flags: 64
    });

    const user = interaction.user.id;

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
            id: schema.servers.id
          })
          .from(schema.servers)
          .where(eq(schema.servers.id, id));

        if (result?.id) {
          await interaction.editReply({
            content: 'Server bereits eingetragen.'
          });

          return;
        }

        await db.insert(schema.servers).values({
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
          .select({ id: schema.servers.id })
          .from(schema.servers)
          .where(eq(schema.servers.id, id));

        if (!result?.id) {
          await interaction.editReply({
            content: 'Server konnte nicht gefunden werden.'
          });

          return;
        }

        await db.delete(schema.servers).where(eq(schema.servers.id, id));

        await interaction.editReply({
          content: 'Server erfolgreich entfernt!'
        });

        break;
      }
      case 'list': {
        const servers = await db
          .select({
            id: schema.servers.id,
            identifier: schema.servers.identifier,
            label: schema.servers.label,
            aliases: schema.servers.aliases
          })
          .from(schema.servers);

        await interaction.editReply({
          content: servers
            .map((server) => {
              const aliases = server.aliases.length
                ? ` — Aliase: ${server.aliases
                    .map((alias) => `\`${alias}\``)
                    .join(', ')}`
                : '';

              return `**${server.label}** (${server.identifier}) \`${server.id}\`${aliases}`;
            })
            .join('\n')
        });

        break;
      }
      case 'alias': {
        const identifier = interaction.options.getString('identifier', true);

        const aliases = [
          ...new Set(
            interaction.options
              .getString('aliases', true)
              .split(/[\s,]+/)
              .map((alias) => alias.trim().toLowerCase())
              .filter(Boolean)
          )
        ];

        if (!aliases.length) {
          await interaction.editReply({
            content: 'Keine gültigen Aliase angegeben.'
          });

          return;
        }

        const [server] = await db
          .select({
            identifier: schema.servers.identifier,
            aliases: schema.servers.aliases
          })
          .from(schema.servers)
          .where(eq(schema.servers.identifier, identifier));

        if (!server) {
          await interaction.editReply({
            content: 'Server konnte nicht gefunden werden.'
          });

          return;
        }

        const taken = await db
          .select({ identifier: schema.servers.identifier })
          .from(schema.servers)
          .where(inArray(schema.servers.identifier, aliases));

        const reserved = new Set([
          server.identifier,
          ...server.aliases,
          ...taken.map((row) => row.identifier)
        ]);

        const added = aliases.filter((alias) => !reserved.has(alias));

        if (!added.length) {
          await interaction.editReply({
            content: 'Alias(e) bereits vergeben oder eingetragen.'
          });

          return;
        }

        await db
          .update(schema.servers)
          .set({ aliases: [...server.aliases, ...added] })
          .where(eq(schema.servers.identifier, server.identifier));

        await interaction.editReply({
          content: `Alias(e) hinzugefügt: ${added
            .map((alias) => `\`${alias}\``)
            .join(', ')}`
        });

        break;
      }
    }
  }
);
