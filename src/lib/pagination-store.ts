import type { ServerResponsePlayer } from '@/lib/utils/server';

const SESSION_TTL_MS = 5 * 60_000;

export interface PaginationSession {
  players: ServerResponsePlayer[];
  page: number;
  locked: boolean;
}

interface InternalSession extends PaginationSession {
  expiryTimer: NodeJS.Timeout;
}

const sessions = new Map<string, InternalSession>();

function scheduleExpiry(id: string): NodeJS.Timeout {
  return setTimeout(() => sessions.delete(id), SESSION_TTL_MS).unref();
}

export function createSession(players: ServerResponsePlayer[]): string {
  const id = Math.random().toString(36).substring(2, 15);

  sessions.set(id, {
    players,
    page: 0,
    locked: false,
    expiryTimer: scheduleExpiry(id)
  });

  return id;
}

export function getSession(id: string): PaginationSession | undefined {
  return sessions.get(id);
}

export function touchSession(id: string): void {
  const session = sessions.get(id);

  if (!session) return;

  clearTimeout(session.expiryTimer);
  session.expiryTimer = scheduleExpiry(id);
}
