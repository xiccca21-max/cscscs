import { Prisma } from "@prisma/client";
import { createPrismaClient } from "../src/lib/create-prisma-client";

const db = createPrismaClient();

const methods = [
  { name: "Balance",             type: "balance",    commission: 0,   minAmount: 0,   currencies: ["USD", "RUB", "EUR"], sortOrder: 0 },
  { name: "Visa / Mastercard",   type: "card",       commission: 2.5, minAmount: 1,   currencies: ["RUB", "USD", "EUR"], sortOrder: 1 },
  { name: "PayPal",              type: "paypal",     commission: 2.5, minAmount: 1,   currencies: ["USD", "EUR", "RUB"], sortOrder: 2 },
  { name: "Alipay",              type: "alipay",     commission: 2.5, minAmount: 1,   currencies: ["USD", "EUR", "CNY", "HKD"], sortOrder: 3 },
  { name: "Bitcoin (BTC)",       type: "btc",        commission: 1,   minAmount: 10,  currencies: ["USD", "EUR"],        sortOrder: 4 },
  { name: "USDT (TRC-20)",       type: "usdt-trc20", commission: 0,   minAmount: 5,   currencies: ["USD", "EUR"],        sortOrder: 5 },
  { name: "Ethereum (ETH)",      type: "eth",        commission: 1,   minAmount: 10,  currencies: ["USD", "EUR"],        sortOrder: 6 },
  { name: "USDT (ERC-20)",       type: "usdt-erc20", commission: 1,   minAmount: 10,  currencies: ["USD", "EUR"],        sortOrder: 7 },
  { name: "Litecoin (LTC)",      type: "ltc",        commission: 1,   minAmount: 5,   currencies: ["USD", "EUR"],        sortOrder: 8 },
  { name: "Bank / Банк",         type: "bank",       commission: 3,   minAmount: 50,  currencies: ["RUB", "USD"],        sortOrder: 9 },
];

async function main() {
  console.log("Seeding payment methods...");
  let created = 0;
  let skipped = 0;

  for (const m of methods) {
    const exists = await db.paymentMethod.findFirst({
      where: { type: m.type },
    });
    if (exists) {
      skipped++;
      console.log(`  ✓ ${m.type} already exists`);
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
    created++;
    console.log(`  + ${m.type}: ${m.name}`);
  }

  console.log(`\nDone: ${created} created, ${skipped} skipped.`);
}

main()
  .then(() => db.$disconnect())
  .catch((e) => {
    console.error(e);
    db.$disconnect();
    process.exit(1);
  });
