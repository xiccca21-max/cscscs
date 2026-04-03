import { Prisma, type OrderStatus, type PrismaClient } from "@prisma/client";

const REFERRAL_BONUS_COMMENT_PREFIX = "Referral bonus:";

export async function getReferralProgramSettings(
  db: Prisma.TransactionClient | PrismaClient,
) {
  const keys = ["referral_reward_usd", "referral_min_order_usd", "min_cashout_usd"] as const;
  const rows = await db.siteSettings.findMany({
    where: { key: { in: [...keys] } },
  });
  const map = Object.fromEntries(rows.map((r) => [r.key, r.value]));
  return {
    rewardUsd: Math.max(0, parseFloat(map.referral_reward_usd ?? "0") || 0),
    minOrderUsd: Math.max(0, parseFloat(map.referral_min_order_usd ?? "0") || 0),
    minCashoutUsd: Math.max(0, parseFloat(map.min_cashout_usd ?? "1") || 0),
  };
}

export async function getMinCashoutUsd(
  db: Prisma.TransactionClient | PrismaClient,
): Promise<number> {
  const row = await db.siteSettings.findUnique({
    where: { key: "min_cashout_usd" },
  });
  const v = parseFloat(row?.value ?? "1");
  return Number.isFinite(v) && v > 0 ? v : 1;
}

/**
 * Однократное начисление пригласившему на баланс, когда приведённый пользователь
 * впервые получает заказ в статусе PAID (как у типичных affiliate: событие — успешная сделка).
 */
export async function applyReferralRewardOnOrderPaid(
  tx: Prisma.TransactionClient,
  params: {
    orderId: string;
    orderNumber: string;
    sellerUserId: string;
    orderTotal: Prisma.Decimal;
    previousStatus: OrderStatus;
    newStatus: OrderStatus;
  },
): Promise<void> {
  if (params.newStatus !== "PAID" || params.previousStatus === "PAID") {
    return;
  }

  const seller = await tx.user.findUnique({
    where: { id: params.sellerUserId },
    select: {
      id: true,
      steamId: true,
      referralId: true,
      referralBonusPaidToReferrerAt: true,
      status: true,
    },
  });

  if (!seller?.referralId || seller.referralBonusPaidToReferrerAt) {
    return;
  }
  if (seller.status === "BLOCKED") {
    return;
  }

  const settings = await getReferralProgramSettings(tx);
  if (settings.rewardUsd <= 0) {
    return;
  }

  const orderTotalNum = Number(params.orderTotal);
  if (!Number.isFinite(orderTotalNum) || orderTotalNum < settings.minOrderUsd) {
    return;
  }

  const referral = await tx.referral.findFirst({
    where: { id: seller.referralId, isActive: true },
  });
  if (!referral) {
    return;
  }

  const referrer = await tx.user.findFirst({
    where: { steamId: referral.name },
  });
  if (!referrer || referrer.id === seller.id || referrer.status === "BLOCKED") {
    return;
  }

  const reward = new Prisma.Decimal(settings.rewardUsd.toFixed(2));
  const nextBal = Number(referrer.balance) + settings.rewardUsd;

  await tx.user.update({
    where: { id: referrer.id },
    data: { balance: new Prisma.Decimal(nextBal.toFixed(2)) },
  });
  await tx.balanceTransaction.create({
    data: {
      userId: referrer.id,
      type: "CREDIT",
      amount: reward,
      balanceAfter: new Prisma.Decimal(nextBal.toFixed(2)),
      comment: `${REFERRAL_BONUS_COMMENT_PREFIX} first paid order #${params.orderNumber} (invited ${seller.steamId})`,
      orderId: params.orderId,
    },
  });
  await tx.user.update({
    where: { id: seller.id },
    data: { referralBonusPaidToReferrerAt: new Date() },
  });
}

export { REFERRAL_BONUS_COMMENT_PREFIX };
