import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const session = await requireAuth();
    const { id } = await context.params;

    const order = await db.order.findFirst({
      where: { id, userId: session.userId },
      select: { id: true },
    });
    if (!order)
      return NextResponse.json(
        { success: false, error: "Order not found" },
        { status: 404 },
      );

    const messages = await db.orderMessage.findMany({
      where: { orderId: id },
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json({ success: true, data: messages });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    if (msg === "Unauthorized")
      return NextResponse.json({ success: false, error: msg }, { status: 401 });
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const session = await requireAuth();
    const { id } = await context.params;

    const order = await db.order.findFirst({
      where: { id, userId: session.userId },
      select: { id: true },
    });
    if (!order)
      return NextResponse.json(
        { success: false, error: "Order not found" },
        { status: 404 },
      );

    const body = await request.json();
    const text = (body.body ?? "").trim();
    if (!text || text.length > 2000)
      return NextResponse.json(
        { success: false, error: "Invalid message" },
        { status: 400 },
      );

    const message = await db.orderMessage.create({
      data: {
        orderId: id,
        authorId: session.userId,
        authorRole: "user",
        body: text,
      },
    });

    return NextResponse.json({ success: true, data: message });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    if (msg === "Unauthorized")
      return NextResponse.json({ success: false, error: msg }, { status: 401 });
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}

export async function PATCH(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const session = await requireAuth();
    const { id } = await context.params;

    const order = await db.order.findFirst({
      where: { id, userId: session.userId },
      select: { id: true },
    });
    if (!order)
      return NextResponse.json(
        { success: false, error: "Order not found" },
        { status: 404 },
      );

    await db.orderMessage.updateMany({
      where: {
        orderId: id,
        authorId: { not: session.userId },
        readAt: null,
      },
      data: { readAt: new Date() },
    });

    return NextResponse.json({ success: true });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    if (msg === "Unauthorized")
      return NextResponse.json({ success: false, error: msg }, { status: 401 });
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
