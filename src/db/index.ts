import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import { upstashCache } from 'drizzle-orm/cache/upstash';

import type { Logger } from 'drizzle-orm';
import chalk from 'chalk';

import { servers, drops } from '@/db/schema/servers';
import notifications from '@/db//schema/notifications';
import notifiedServers from '@/db/schema/notified-servers';

export class DrizzleLogger implements Logger {
  private getQueryType(query: string): string {
    return query.split(' ')[0]?.toUpperCase() ?? '';
  }

  private getColorForQueryType(queryType: string): chalk.Chalk {
    switch (queryType) {
      case 'SELECT':
        return chalk.blue;
      case 'INSERT':
        return chalk.green;
      case 'UPDATE':
        return chalk.yellow;
      case 'DELETE':
        return chalk.red;
      case 'CREATE':
        return chalk.magenta;
      case 'ALTER':
        return chalk.cyan;
      case 'DROP':
        return chalk.red;
      default:
        return chalk.white;
    }
  }

  logQuery(query: string, params: unknown[]) {
    const queryType = this.getQueryType(query);
    const color = this.getColorForQueryType(queryType);

    const timestamp = new Date().toISOString();

    console.log(
      color(`[${timestamp}] ${queryType} Query:`),
      '\n',
      color(query),
      '\n',
      chalk.gray('Parameters:'),
      chalk.gray(JSON.stringify(params, null, 2))
    );
  }
}

const schema = {
  servers,
  drops,
  notifiedServers,
  notifications
};

const db = drizzle({
  client: postgres(env.NEON_DATABASE_URL),
  casing: 'snake_case',
  schema,
  logger: new DrizzleLogger(),
  cache: upstashCache({
    url: env.REDIS_URL,
    token: env.REDIS_TOKEN,
    global: true,
    config: {
      ex: 3 * 60,
      keepTtl: true
    }
  })
});

global.db = db;
global.schema = schema;

export { db, schema, type schema as Schema, type db as DB };

export default db;
