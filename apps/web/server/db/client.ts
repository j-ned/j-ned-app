import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { env } from '../lib/env.js';
import * as schema from './schema/index';

// Remove ?schema=public (Prisma-specific param not supported by postgres.js)
const dbUrl = env.DATABASE_URL.replace(/[?&]schema=[^&]+/, '');
const queryClient = postgres(dbUrl);

export const db = drizzle(queryClient, { schema });
