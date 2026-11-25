import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function buildDatabaseUrl(rawUrl: string | undefined): string | undefined {
  if (!rawUrl) return undefined;
  const params: string[] = [];
  if (!rawUrl.includes('connect_timeout=')) params.push('connect_timeout=15');
  if (!rawUrl.includes('pool_timeout=')) params.push('pool_timeout=15');
  if (params.length === 0) return rawUrl;
  const sep = rawUrl.includes('?') ? '&' : '?';
  return `${rawUrl}${sep}${params.join('&')}`;
}

const datasourceUrl = buildDatabaseUrl(process.env.DATABASE_URL);

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    ...(datasourceUrl ? { datasourceUrl } : {}),
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

/**
 * Retry transient connection/wake-up failures (e.g. Neon Free scale-to-zero cold start).
 */
export async function withDbRetry<T>(
  operation: () => Promise<T>,
  retries = 1
): Promise<T> {
  try {
    return await operation();
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    const isTransient =
      message.includes("Can't reach database server") ||
      message.includes('P1001') ||
      message.includes('ETIMEDOUT') ||
      message.includes('Connection terminated');
    if (retries > 0 && isTransient) {
      await new Promise((resolve) => setTimeout(resolve, 1500));
      return withDbRetry(operation, retries - 1);
    }
    throw err;
  }
}
