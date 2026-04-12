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
