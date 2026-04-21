import { command } from '@/lib/commands';
import loadNotifications from '@/scripts/load-notifications';
import { SlashCommandBuilder } from 'discord.js';

export default command(
  new SlashCommandBuilder()
    .setName('add-notification')
    .addStringOption((option) =>
      option.setName('message').setDescription('The message').setRequired(true)
    )
    .addStringOption((option) =>
      option
        .setName('attachment_url')
        .setDescription('The attachment URL')
        .setRequired(false)
    )
    .setDescription('Manage notifications'),
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

    const message = interaction.options.getString('message', true);
    const attachmentURL = interaction.options.getString(
      'attachment_url',
      false
    );

    await db.insert(schema.notifications).values({
      message,
      attachmentURL
    });

    await loadNotifications();

    await interaction.editReply({
      content: 'Benachrichtigung erfolgreich eingetragen!'
    });
  }
);
