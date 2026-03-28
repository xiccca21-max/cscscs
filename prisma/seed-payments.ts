import { PrismaClient, Prisma } from "@prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";

const adapter = new PrismaNeon({
  connectionString: process.env.DATABASE_URL ?? "postgresql://postgres:postgres@localhost:5432/cs_ne_go",
});
const db = new PrismaClient({ adapter });

const methods = [
  { name: "Balance", type: "balance", commission: 0, minAmount: 0, currencies: ["USD", "RUB", "EUR"], sortOrder: 0 },
  { name: "Карта / Card", type: "card", commission: 2.5, minAmount: 1, currencies: ["RUB", "USD", "EUR"], sortOrder: 1 },
  { name: "Crypto", type: "crypto", commission: 1, minAmount: 5, currencies: ["USD", "EUR"], sortOrder: 2 },
  { name: "Банк / Bank", type: "bank", commission: 3, minAmount: 10, currencies: ["RUB"], sortOrder: 3 },
];

async function main() {
  for (const m of methods) {
    const exists = await db.paymentMethod.findFirst({ where: { type: m.type } });
    if (exists) {
      console.log(`Skipped ${m.type} (already exists)`);
      continue;
    }
    await db.paymentMethod.create({
      data: {
        name: m.name,
        type: m.type,
        commission: new Prisma.Decimal(m.commission.toFixed(2)),
        minAmount: new Prisma.Decimal(m.minAmount.toFixed(2)),
        currencies: m.currencies,
        requiredFields: {},
        sortOrder: m.sortOrder,
        isActive: true,
      },
    });
    console.log(`Created ${m.type}: ${m.name}`);
  }
}

main().then(() => db.$disconnect()).catch((e) => { console.error(e); db.$disconnect(); process.exit(1); });
