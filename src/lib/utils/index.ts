import { RGBTuple } from 'discord.js';

export interface ServerResponsePlayer {
  endpoint: string;
  id: number;
  identifiers: string[];
  name: string;
  ping: number;
}

export interface ServerResponse {
  Data: {
    players: ServerResponsePlayer[];
    vars: Record<string, string>;
  };
  EndPoint: string;
}

export function isServerResponse(value: unknown): value is ServerResponse {
  return (
    typeof value === 'object' &&
    value !== null &&
    'Data' in value &&
    'EndPoint' in value
  );
}

export function getPingEmoji(ping: number): string {
  if (ping <= 30) return '<:status_online:1493077129242476604>';
  if (ping <= 70) return '<:status_idle:1493077127703035945>';
  return '<:status_dnd:1493077126273040394>';
}

export function getCountEmoji(count: number): string {
  if (count <= 5) return '<:status_dnd:1493077126273040394>';
  if (count <= 15) return '<:status_idle:1493077127703035945>';
  return '<:status_online:1493077129242476604>';
}

const DEFAULT_RGB_TUPLE: RGBTuple = [0, 0, 0];

export function hexToRGB(hex: string): RGBTuple {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);

  if (!result) return DEFAULT_RGB_TUPLE;

  return result
    ? [
        parseInt(result[1]!, 16),
        parseInt(result[2]!, 16),
        parseInt(result[3]!, 16)
      ]
    : DEFAULT_RGB_TUPLE;
}
