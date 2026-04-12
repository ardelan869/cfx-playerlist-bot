import { event, Events } from '@/lib/events';
import { Interaction } from 'discord.js';

type InteractionHandler<T extends Interaction> = (
  interaction: T
) => Promise<void>;

async function handleInteraction<T extends Interaction>(
  interaction: T,
  type: string,
  collection: 'commands' | 'buttons' | 'modals' | 'selections'
): Promise<void> {
  const key =
    'customId' in interaction
      ? interaction.customId
      : 'commandName' in interaction
        ? interaction.commandName
        : null;

  if (key === null) return console.warn(`Unable to find key for ${type}`);

  let item = global.client[collection].get(key);

  if (!item) {
    if (collection === 'buttons') {
      item = global.client.buttons.find((button) => key.startsWith(button.id));
    }

    if (!item) return console.warn(`No ${type} matching ${key} was found.`);
  }

  try {
    if (typeof item === 'function') item(interaction as never);
    else if ('callback' in item && typeof item.callback === 'function')
      await (item.callback as (interaction: Interaction) => Promise<void>)(
        interaction
      );
    else throw new Error(`Invalid ${type} structure`);
  } catch (error) {
    console.error(`Error in ${type}:`, error);

    if ('reply' in interaction && typeof interaction.followUp === 'function')
      await interaction
        .followUp({
          content: `An error occurred while executing this ${type}.`,
          flags: 64
        })
        .catch(console.error);
  }
}

const interactionHandlers: {
  [K in Interaction['constructor']['name']]?: InteractionHandler<
    Extract<Interaction, { constructor: { name: K } }>
  >;
} = {
  ChatInputCommandInteraction: (interaction) =>
    handleInteraction(interaction, 'command', 'commands'),
  ButtonInteraction: (interaction) =>
    handleInteraction(interaction, 'button', 'buttons'),
  ModalSubmitInteraction: (interaction) =>
    handleInteraction(interaction, 'modal', 'modals'),
  StringSelectMenuInteraction: (interaction) =>
    handleInteraction(interaction, 'selection', 'selections')
};

export default event(Events.InteractionCreate, async (interaction) => {
  if (interaction.isAutocomplete()) {
    const focused = interaction.options.getFocused();
    const servers = await db
      .select({
        label: global.schema.servers.label,
        identifier: global.schema.servers.identifier
      })
      .from(global.schema.servers);

    const filtered = servers.filter((server) =>
      server.identifier.startsWith(focused)
    );

    await interaction.respond(
      filtered.map((server) => ({
        name: server.label,
        value: server.identifier
      }))
    );

    return;
  }

  const handler =
    interactionHandlers[
      interaction.constructor.name as keyof typeof interactionHandlers
    ];

  if (handler) return await handler(interaction as never);

  console.warn(
    `No interaction handler for type ${interaction.constructor.name} was found.`
  );
});
