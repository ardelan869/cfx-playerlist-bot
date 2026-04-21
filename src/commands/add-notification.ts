import { command } from '@/lib/commands';
import { awaitModal } from '@/lib/modals';
import loadNotifications from '@/scripts/load-notifications';
import { ModalBuilder, SlashCommandBuilder, TextInputStyle } from 'discord.js';

export default command(
  new SlashCommandBuilder()
    .setName('add-notification')
    .setDescription('Manage notifications'),
  async (interaction) => {
    const user = interaction.user.id;

    // FIXME: hardcode it for now
    if (user !== '852630017404960848') {
      await interaction.reply({
        content: 'Du bist nicht berechtigt, diesen Befehl zu verwenden.',
        flags: 64
      });

      return;
    }

    const MODAL_ID = 'new-notification';

    const modal = new ModalBuilder()
      .setCustomId(MODAL_ID)
      .setTitle('Neue Benachrichtigung')
      .addLabelComponents(
        (l) =>
          l
            .setLabel('Message')
            .setDescription('The message to appear in the notification')
            .setTextInputComponent((t) =>
              t
                .setCustomId('message')
                .setStyle(TextInputStyle.Paragraph)
                .setPlaceholder('Lorem ipsum dolor sit amet')
                .setMinLength(1)
                .setMaxLength(1000)
                .setRequired(true)
            ),
        (l) =>
          l
            .setLabel('URL')
            .setDescription('Add your attachment URL')
            .setTextInputComponent((input) =>
              input
                .setCustomId('attachment_url')
                .setStyle(TextInputStyle.Short)
                .setPlaceholder('https://example.com')
                .setMaxLength(128)
                .setMinLength(3)
                .setRequired(false)
            )
      );

    await interaction.showModal(modal);

    const modalInteraction = await awaitModal(MODAL_ID);

    await modalInteraction.deferReply({
      flags: 64
    });

    const message = modalInteraction.fields.getTextInputValue('message');
    const attachmentURL =
      modalInteraction.fields.getTextInputValue('attachment_url');

    await db.insert(schema.notifications).values({
      message,
      attachmentURL:
        attachmentURL && attachmentURL.length > 0 ? attachmentURL : null
    });

    await loadNotifications();

    await modalInteraction.editReply({
      content: 'Benachrichtigung erfolgreich eingetragen!'
    });
  }
);
