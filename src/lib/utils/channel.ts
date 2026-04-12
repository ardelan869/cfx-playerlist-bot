import type {
  Channel,
  MessagePayload,
  MessageCreateOptions,
  MessageEditOptions
} from 'discord.js';
import { eq } from 'drizzle-orm';

export async function sendMessage(
  _channel: string | Channel | null | undefined,
  options: string | MessagePayload | MessageCreateOptions
) {
  if (!_channel) return;

  const channel =
    typeof _channel === 'string'
      ? client.channels.cache.get(_channel)
      : _channel;

  if (!channel || !('send' in channel)) return;

  return await channel.send(options);
}

async function createAndStoreMessage(
  key: string,
  channelId: string,
  options: MessageCreateOptions | MessagePayload | string
): Promise<boolean> {
  const channel = await client.channels.fetch(channelId);

  if (!channel?.isTextBased() || !channel.isSendable()) return false;

  const message = await channel.send(options as MessageCreateOptions);

  await db
    .insert(schemas.persistentMessage)
    .values({
      key,
      messageId: message.id,
      channelId: message.channelId
    })
    .onConflictDoUpdate({
      target: schemas.persistentMessage.key,
      set: {
        messageId: message.id,
        channelId: message.channelId
      }
    });

  return true;
}

export async function sendPersistentMessage(
  key: string,
  channelId: null | undefined,
  options: string | MessagePayload | MessageEditOptions
): Promise<boolean>;

export async function sendPersistentMessage(
  key: string,
  channelId: string,
  options: string | MessagePayload | MessageCreateOptions
): Promise<boolean>;

export async function sendPersistentMessage(
  key: string,
  channelId: string | null | undefined,
  options: string | MessagePayload | MessageEditOptions | MessageCreateOptions
): Promise<boolean> {
  const [data] = await db
    .select({
      channelId: schemas.persistentMessage.channelId,
      messageId: schemas.persistentMessage.messageId
    })
    .from(schemas.persistentMessage)
    .where(eq(schemas.persistentMessage.key, key))
    .limit(1);

  if (data?.channelId && data?.messageId) {
    try {
      const channel = await client.channels.fetch(data.channelId);

      if (!channel?.isTextBased()) return false;

      const message = await channel.messages.fetch(data.messageId);

      await message.edit(options as MessageEditOptions);

      return true;
    } catch {
      if (!channelId) return false;

      return createAndStoreMessage(key, channelId, options as never);
    }
  }

  if (!channelId) return false;

  return createAndStoreMessage(key, channelId, options as never);
}

export async function setChannelName(
  _channel: string | Channel | null | undefined,
  name: string
) {
  if (!_channel) return;

  const channel =
    typeof _channel === 'string'
      ? client.channels.cache.get(_channel)
      : _channel;

  if (!channel || !('setName' in channel) || channel.name === name) return;

  return await channel.setName(name);
}
