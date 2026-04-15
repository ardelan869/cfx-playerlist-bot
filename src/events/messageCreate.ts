import { handleSearch } from '@/commands/search';
import { event } from '@/lib/events';

const MUFASA_ALIASES = ['mufasa', 'moufasa'];

const MUFASA_PICS = [
  'https://cdn.discordapp.com/attachments/1487931886423769370/1493999019653988452/IMG_2153.jpg',
  'https://cdn.discordapp.com/attachments/1487931886423769370/1493999030030827722/IMG_2149.jpg',
  'https://cdn.discordapp.com/attachments/1487931886423769370/1493999041137348719/IMG_2152.jpg',
  'https://cdn.discordapp.com/attachments/1487931886423769370/1493999105863712819/IMG_1840.jpg',
  'https://cdn.discordapp.com/attachments/1487931886423769370/1493999133420294376/IMG_1728.jpg',
  'https://cdn.discordapp.com/attachments/1487931886423769370/1493999143658459168/2E7043C2-F0E3-403D-9454-F9D33193A265.png',
  'https://cdn.discordapp.com/attachments/1487931886423769370/1493999154936938526/FB545A0F-0CC0-4B5D-99B0-522FAF1A49F1.png',
  'https://cdn.discordapp.com/attachments/1487931886423769370/1493999211900047452/IMG_1595.jpg',
  'https://cdn.discordapp.com/attachments/1487931886423769370/1493999212260622416/IMG_1594.jpg',
  'https://cdn.discordapp.com/attachments/1487931886423769370/1493999212596039882/IMG_1593.jpg',
  'https://cdn.discordapp.com/attachments/1487931886423769370/1493999236340252682/DD5B93E2-CA1F-4B9F-9509-F96EF82D8185.jpg',
  'https://cdn.discordapp.com/attachments/1487931886423769370/1493999250500227143/C9D14E6A-F4B2-4832-B9A2-70FADB8F5B91.jpg'
];

export default event('messageCreate', async (message) => {
  if (message.author.bot) return;

  const channel = message.channel;

  if (!channel.isSendable() || !message.content.startsWith('!')) return;

  const [identifier, ...args] = message.content
    .replace('!', '')
    .trim()
    .split(' ');

  if (!identifier) return;

  if (MUFASA_ALIASES.includes(identifier)) {
    await message.reply({
      content: MUFASA_PICS[Math.floor(Math.random() * MUFASA_PICS.length)]
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
    reply: (options) => message.reply(options)
  });
});
