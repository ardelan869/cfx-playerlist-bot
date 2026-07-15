import type { z } from 'zod';
import type { envSchema } from './env';
import type { Schema, DB, Redis } from '@/db';
import type { ServerResponsePlayer } from '@/lib/utils/server';

declare global {
  var client: import('@/index').ExtendedClient;
  var env: z.infer<typeof envSchema>;
  var dev: boolean;
  var config: typeof import('../config.json');
  var db: typeof DB;
  var schema: typeof Schema;
  var redis: typeof Redis;
  var cachedResponses: Record<string, ServerResponsePlayer[]>;
  var currentPageIdx: Record<string, number>;
}
