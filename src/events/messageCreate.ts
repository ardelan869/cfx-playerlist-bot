import { handleSearch } from '@/commands/search';
import { event } from '@/lib/events';

export default event('messageCreate', async (message) => {
  if (message.author.bot) return;

  const channel = message.channel;

  if (!channel.isSendable() || !message.content.startsWith('!')) return;

  const args = message.content.replace('!', '').trim().split(' ');

  if (args.length < 2) {
    message.reply({
      content: `Nutzung: **!<identifier> <query>**
Beispiel: **!fc saints**`
    });

    return;
  }

  const identifier = args[0]!;
  const query = args.slice(1).join(' ');

  handleSearch({
    identifier,
    query,
    reply: (options) => message.reply(options)
  });
});
