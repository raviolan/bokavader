import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

export const hasDatabaseUrl = Boolean(process.env.DATABASE_URL);
export const databaseDisabled = process.env.DISABLE_DATABASE === "true";
export const isDatabaseEnabled = hasDatabaseUrl && !databaseDisabled;

function createPrismaClient() {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error("DATABASE_URL is not configured.");
  }

  return new PrismaClient({
    adapter: new PrismaPg(connectionString),
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });
}

export const prisma =
  isDatabaseEnabled ? globalForPrisma.prisma ?? createPrismaClient() : undefined;

if (process.env.NODE_ENV !== "production" && prisma) {
  globalForPrisma.prisma = prisma;
}
