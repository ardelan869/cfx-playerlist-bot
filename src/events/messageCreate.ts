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

  if (!identifier || !identifier.length || !args.length) {
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
    reply: (options) => message.reply(options)
  });
});
