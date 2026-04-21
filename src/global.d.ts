import type { z } from 'zod';
import type { envSchema } from './env';
import type { Schema, DB } from '@/db';

declare global {
  var client: import('@/index').ExtendedClient;
  var env: z.infer<typeof envSchema>;
  var dev: boolean;
  var config: typeof import('../config.json');
  var db: typeof DB;
  var schema: typeof Schema;
  var notifications: (typeof Schema.notifications.$inferSelect)[];
}
