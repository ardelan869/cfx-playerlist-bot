export type ServerGame = 'gta5' | 'rdr3' | string;

export interface ServerResponse {
  endpoint: string;
  hostname: string;
  clean_name: string;
  clients: number;
  sv_maxclients: number;
  game: ServerGame;
  locale: string;
  premium: string;
  tags: string;
  owner: string;
  server_version: string;
  icon_version: number;
  banner_detail: string;
  discord: string;
  owner_name: string;
  owner_profile: string;
  project_name: string;
  project_desc: string;
  rank: number;
  game_rank: number;
  updated_at: string;
  resources: string[];
  connect_ip: string;
}

export interface ServerResponsePlayer {
  clean_name: string;
  name: string;
  id: number;
  ping: number;
  game: ServerGame;
}

export function isServerResponse(value: unknown): value is ServerResponse {
  return (
    typeof value === 'object' &&
    value !== null &&
    'endpoint' in value &&
    'hostname' in value &&
    'clean_name' in value &&
    'clients' in value &&
    'sv_maxclients' in value &&
    'game' in value &&
    'locale' in value &&
    'premium' in value &&
    'tags' in value &&
    'owner' in value &&
    'server_version' in value &&
    'icon_version' in value &&
    'banner_detail' in value &&
    'discord' in value &&
    'owner_name' in value &&
    'owner_profile' in value &&
    'project_name' in value &&
    'project_desc' in value &&
    'rank' in value &&
    'game_rank' in value &&
    'updated_at' in value &&
    'resources' in value &&
    'connect_ip' in value
  );
}

export async function getServerInfo(server: string): Promise<ServerResponse> {
  const cacheKey = `server:${server}`;
  const cache = await redis.get(cacheKey);

  if (typeof cache === 'string') {
    const parsed = JSON.parse(cache);

    if (isServerResponse(parsed)) return parsed;

    await redis.del(cacheKey);

    throw new Error('Cached server response is not valid');
  }

  const resp = await fetch(`https://fivestats.io/api/servers/${server}`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${env.FIVE_STATS_API}`
    }
  });

  if (resp.status !== 200) {
    throw new Error('FiveStats API returned an error');
  }

  const data = await resp.json();

  if (!isServerResponse(data)) {
    throw new Error('Server response is not valid');
  }

  await redis.set(cacheKey, JSON.stringify(data), {
    ex: 60
  });

  return data;
}

export function isPlayersResponse(
  value: unknown
): value is ServerResponsePlayer[] {
  return (
    Array.isArray(value) &&
    value.every(
      (v) =>
        typeof v === 'object' &&
        'clean_name' in v &&
        'name' in v &&
        'id' in v &&
        'ping' in v &&
        'game' in v
    )
  );
}

export function dedupePlayers(
  players: ServerResponsePlayer[]
): ServerResponsePlayer[] {
  const usedNames: Record<string, ServerResponsePlayer> = {};
  const dedupedPlayers: Record<number, ServerResponsePlayer> = {};

  for (const player of players) {
    const playerId = player.id;

    if (
      playerId in dedupedPlayers ||
      (usedNames[player.name] && playerId <= usedNames[player.name]!.id)
    ) {
      continue;
    }

    usedNames[player.name] = player;
    dedupedPlayers[playerId] = player;
  }

  return Object.values(dedupedPlayers);
}

export async function getPlayersFromServer(
  server: string
): Promise<ServerResponsePlayer[]> {
  const cacheKey = `players:${server}`;
  const cache = await redis.get(cacheKey);

  if (typeof cache === 'string') {
    const parsed = JSON.parse(cache);

    if (isPlayersResponse(parsed)) return dedupePlayers(parsed);

    await redis.del(cacheKey);

    throw new Error('Cached players response is not valid');
  }

  const resp = await fetch(
    `https://fivestats.io/api/servers/${server}/players`,
    {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${env.FIVE_STATS_API}`
      }
    }
  );

  const data = await resp.json();

  if (!isPlayersResponse(data)) {
    throw new Error('Players response is not valid');
  }

  await redis.set(cacheKey, JSON.stringify(data), {
    ex: 60
  });

  return dedupePlayers(data);
}
