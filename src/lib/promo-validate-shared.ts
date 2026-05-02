import { db } from "@/lib/db";
import { OrderStatus } from "@prisma/client";

/**
 * Whether the user qualifies for \"new sellers only\" promos (no completed payout yet).
 */
export async function userEligibleForNewUserPromo(userId: string): Promise<boolean> {
  const paidOrders = await db.order.count({
    where: { userId, status: OrderStatus.PAID },
  });
  return paidOrders === 0;
}
