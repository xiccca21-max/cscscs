import type { Game } from "@prisma/client";

export interface SteamInventoryItem {
  assetId: string;
  classId: string;
  instanceId: string;
  name: string;
  iconUrl: string | null;
  tradable: boolean;
  condition: string | null;
  quality: string | null;
}

export interface PricedInventoryItem extends SteamInventoryItem {
  basePrice: number;
  buyoutPrice: number;
  currency: string;
  available: boolean;
}

export interface CreateOrderRequest {
  items: {
    assetId: string;
    classId: string;
    instanceId: string;
    name: string;
    game: Game;
    condition?: string;
    quality?: string;
    imageUrl?: string;
    basePrice: number;
    buyoutPrice: number;
  }[];
  tradeUrl: string;
  paymentMethodId: string;
  currency: string;
  paymentDetails: Record<string, string>;
}

export interface CreateCashoutRequest {
  amount: number;
  paymentMethod: string;
  currency: string;
  paymentDetails: Record<string, string>;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface PaymentFieldDefinition {
  name: string;
  label: Record<string, string>;
  type: "text" | "email" | "tel" | "select";
  required: boolean;
  placeholder?: Record<string, string>;
  options?: { value: string; label: Record<string, string> }[];
  validation?: string;
}

export interface ReferralStats {
  totalUsers: number;
  usersWithOrders: number;
  usersWithCompletedOrders: number;
  totalOrders: number;
  completedOrders: number;
  totalVolume: number;
}
