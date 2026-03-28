import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";

const DEFAULTS = [
  { name: "Balance", type: "balance", commission: 0, minAmount: 0, currencies: ["USD", "RUB", "EUR"], sortOrder: 0 },
  { name: "Карта / Card", type: "card", commission: 2.5, minAmount: 1, currencies: ["RUB", "USD", "EUR"], sortOrder: 1 },
  { name: "Crypto", type: "crypto", commission: 1, minAmount: 5, currencies: ["USD", "EUR"], sortOrder: 2 },
  { name: "Банк / Bank", type: "bank", commission: 3, minAmount: 10, currencies: ["RUB"], sortOrder: 3 },
];

export async function POST() {
  try {
    await requireAdmin();
    const created: string[] = [];
    for (const m of DEFAULTS) {
      const exists = await db.paymentMethod.findFirst({ where: { type: m.type } });
      if (exists) continue;
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
      created.push(m.type);
    }
    return NextResponse.json({ success: true, created });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ success: false, error: msg }, { status: msg === "Unauthorized" ? 401 : msg === "Forbidden" ? 403 : 500 });
  }
}
