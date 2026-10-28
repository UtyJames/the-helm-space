import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { withAccelerate } from "@prisma/extension-accelerate";
import { Pool } from "pg";

const globalForPrisma = globalThis as unknown as {
  prisma: any;
};

function createPrismaClient() {
  const directUrl = process.env.DIRECT_URL;
  const databaseUrl = process.env.DATABASE_URL;
  const connectionString = directUrl || databaseUrl || "postgresql://placeholder:placeholder@localhost:5432/placeholder";

  if (connectionString && !connectionString.startsWith("prisma://") && !connectionString.startsWith("prisma+postgres://")) {
    const pool = new Pool({
      connectionString,
      ssl: { rejectUnauthorized: false },
      max: 10,
    });
    const adapter = new PrismaPg(pool);
    return new PrismaClient({ adapter });
  }

  if (databaseUrl && (databaseUrl.startsWith("prisma://") || databaseUrl.startsWith("prisma+postgres://"))) {
    return new PrismaClient({
      accelerateUrl: databaseUrl,
    } as never).$extends(withAccelerate());
  }

  // Fallback for build-time import without env vars — never query in this state.
  const pool = new Pool({ connectionString: "postgresql://placeholder:placeholder@localhost:5432/placeholder", ssl: { rejectUnauthorized: false } });
  return new PrismaClient({ adapter: new PrismaPg(pool) });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}