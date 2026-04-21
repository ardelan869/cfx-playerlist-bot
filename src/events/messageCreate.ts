import { handleSearch } from '@/commands/search';
import { event } from '@/lib/events';

export default event('messageCreate', async (message) => {
  if (message.author.bot) return;

  const channel = message.channel;

  if (!channel.isSendable() || !message.content.startsWith('!')) return;

  const [identifier, ...args] = message.content
    .replace('!', '')
    .trim()
    .split(' ');

  if (!identifier) return;

  const pet = config.pets.find((pet) => pet.name.includes(identifier));

  if (pet) {
    const guilds = typeof pet.guild === 'string' ? [pet.guild] : pet.guild;

    if (guilds && message.guildId && !guilds.includes(message.guildId)) {
      return;
    }

    await message.reply({
      content: pet.images[Math.floor(Math.random() * pet.images.length)]
    });

    return;
  }

  if (!identifier.length || !args.length) {
    message.reply({
      content: `Nutzung: **!<identifier> <query>**
Beispiel: **!fc saints**`
    });

    return;
  }

  const query = args.join(' ');

  handleSearch({
    identifier,
    query,
    guild: message.guild,
    reply: (options) => message.reply(options),
    send: (options) => message.channel.send(options)
  });
});
