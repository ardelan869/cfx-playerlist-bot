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

export function getPingEmoji(ping: number): string {
  if (ping <= 30) return '🟢';
  if (ping <= 70) return '🟡';
  return '🔴';
}
