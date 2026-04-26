import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const connectionString = process.env.DATABASE_URL!;

function createPrismaClient() {
    if (!connectionString) {
        // Return a proxy or null to avoid crashing the whole server if DB is not configured
        console.warn("DATABASE_URL is not defined. Database features will be unavailable.");
        return null as any;
    }
    const adapter = new PrismaPg({ connectionString });
    return new PrismaClient({ adapter });
}

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

export const prisma = globalForPrisma.prisma || createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
