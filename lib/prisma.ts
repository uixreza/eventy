import { PrismaClient } from "@prisma/client";

/**
 * Prisma client. A single instance is reused across hot reloads in dev —
 * otherwise every edit would open a new connection pool against Neon.
 */
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
