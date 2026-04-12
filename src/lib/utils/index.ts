import type { RGBTuple } from 'discord.js';

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

export function chunkArray<T>(array: T[], size: number): T[][] {
  const result: T[][] = [];

  for (let i = 0; i < array.length; i += size) {
    result.push(array.slice(i, i + size));
  }

  return result;
}

interface ServerResponsePlayer {
  endpoint: string;
  id: number;
  identifiers: string[];
  name: string;
  ping: number;
}

interface ServerResponse {
  Data: {
    players: ServerResponsePlayer[];
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
