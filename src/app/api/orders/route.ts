import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { generateOrderNumber, getSteamProfileUrl, isValidTradeUrl } from "@/lib/utils";
import { Prisma, type Game } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";

type OrderItemInput = {
  game: Game;
  name: string;
  externalId: string;
  classId?: string;
  instanceId?: string;
  condition?: string;
  quality?: string;
  imageUrl?: string;
  basePrice: number;
  buyoutPrice: number;
  currency: string;
};

type CreateOrderBody = {
  items: OrderItemInput[];
  tradeUrl: string;
  paymentMethodId: string;
  currency: string;
  paymentDetails?: Prisma.InputJsonValue;
};

export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth();
    if (!session.steamId) {
      return NextResponse.json(
        { success: false, error: "Steam ID not linked" },
        { status: 400 },
      );
    }

    let body: CreateOrderBody;
    try {
      body = (await request.json()) as CreateOrderBody;
    } catch {
      return NextResponse.json(
        { success: false, error: "Invalid JSON body" },
        { status: 400 },
      );
    }

    const { items, tradeUrl, paymentMethodId, currency } = body;
    if (!items?.length) {
      return NextResponse.json(
        { success: false, error: "items must be a non-empty array" },
        { status: 400 },
      );
    }
    if (!tradeUrl || !isValidTradeUrl(tradeUrl)) {
      return NextResponse.json(
        { success: false, error: "Invalid trade URL" },
        { status: 400 },
      );
    }
    if (!paymentMethodId) {
      return NextResponse.json(
        { success: false, error: "paymentMethodId is required" },
        { status: 400 },
      );
    }
    if (!currency) {
      return NextResponse.json(
        { success: false, error: "currency is required" },
        { status: 400 },
      );
    }

    const paymentMethod = await db.paymentMethod.findFirst({
      where: { id: paymentMethodId, isActive: true },
    });
    if (!paymentMethod) {
      return NextResponse.json(
        { success: false, error: "Payment method not found or inactive" },
        { status: 400 },
      );
    }

    const totalAmount = items.reduce((sum, i) => sum + Number(i.buyoutPrice), 0);
    if (totalAmount <= 0) {
      return NextResponse.json(
        { success: false, error: "Invalid order total" },
        { status: 400 },
      );
    }

    const orderNumber = generateOrderNumber();
    const steamId = session.steamId;
    const steamProfileUrl = getSteamProfileUrl(steamId);
    const paymentDetails = body.paymentDetails ?? {};

    const order = await db.$transaction(async (tx) => {
      const created = await tx.order.create({
        data: {
          orderNumber,
          userId: session.userId,
          steamId,
          steamProfileUrl,
          tradeUrl,
          totalAmount: new Prisma.Decimal(totalAmount.toFixed(2)),
          currency,
          paymentMethodId,
          paymentDetails,
          items: {
            create: items.map((i) => ({
              game: i.game,
              name: i.name,
              externalId: i.externalId,
              classId: i.classId,
              instanceId: i.instanceId,
              condition: i.condition,
              quality: i.quality,
              imageUrl: i.imageUrl,
              basePrice: new Prisma.Decimal(Number(i.basePrice).toFixed(2)),
              buyoutPrice: new Prisma.Decimal(Number(i.buyoutPrice).toFixed(2)),
              currency: i.currency,
            })),
          },
        },
      });

      if (paymentMethod.type === "balance") {
        await tx.balanceTransaction.create({
          data: {
            userId: session.userId,
            type: "FREEZE",
            amount: new Prisma.Decimal(totalAmount.toFixed(2)),
            balanceAfter: new Prisma.Decimal("0"),
            comment: `Order ${orderNumber} — payout frozen until trade complete`,
            orderId: created.id,
          },
        });
      }

      return created;
    });

    return NextResponse.json({
      success: true,
      data: { orderId: order.id, orderNumber: order.orderNumber },
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    if (message === "Unauthorized") {
      return NextResponse.json({ success: false, error: message }, { status: 401 });
    }
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
