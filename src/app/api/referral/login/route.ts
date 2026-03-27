import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    let body: { code: string; password: string };
    try {
      body = (await request.json()) as { code: string; password: string };
    } catch {
      return NextResponse.json(
        { success: false, error: "Invalid JSON body" },
        { status: 400 },
      );
    }

    if (!body.code || !body.password) {
      return NextResponse.json(
        { success: false, error: "code and password are required" },
        { status: 400 },
      );
    }

    const referral = await db.referral.findFirst({
      where: {
        code: body.code,
        password: body.password,
        isActive: true,
      },
    });

    if (!referral) {
      return NextResponse.json(
        { success: false, error: "Invalid code or password" },
        { status: 401 },
      );
    }

    const session = await getSession();
    session.isReferral = true;
    session.referralId = referral.id;
    await session.save();

    return NextResponse.json({ success: true });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 },
    );
  }
}
