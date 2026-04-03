import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const DEFAULT_URL =
  "postgresql://postgres:postgres@localhost:5432/cs_ne_go?schema=public";

export function createPrismaClient(): PrismaClient {
  const url = process.env.DATABASE_URL ?? DEFAULT_URL;
  return new PrismaClient({
    adapter: new PrismaPg({ connectionString: url }),
  });
}
