// Single shared Prisma client. Next.js hot-reloads server code in dev, which
// would otherwise create a new client (and a new DB connection pool) on
// every edit - this pattern keeps one instance alive across reloads.
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined };

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
