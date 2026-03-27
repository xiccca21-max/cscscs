import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const methods = await db.paymentMethod.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" },
      select: {
        id: true,
        name: true,
        type: true,
        commission: true,
        minAmount: true,
        currencies: true,
        requiredFields: true,
      },
    });

    return NextResponse.json({
      success: true,
      data: methods.map((m) => ({
        ...m,
        commission: m.commission.toString(),
        minAmount: m.minAmount.toString(),
      })),
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 },
    );
  }
}
