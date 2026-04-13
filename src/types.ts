export interface GameOut {
  id: string;
  name: string;
  imageUrl: string | null;
  storeUrl: string | null;
  platforms: string;
  priceOriginalUsd: number | null;
  priceDiscountedUsd: number | null;
  discountPercent: number;
  discountEndAt: string | null;
  selected: boolean;
  published: boolean;
  notes: string;
  active: boolean;
  costClp: number | null;
  primaria1: number | null;
  primaria2: number | null;
  secundaria: number | null;
}

export interface PricingSettings {
  usdToClp: number;
  purchaseFeePct: number;
  primaria1Mult: number;
  primaria2Mult: number;
  secundariaMult: number;
  roundTo: number;
}

export interface PsnConfig {
  region: string;
  dealsCategoryId: string;
  categoryGridHash: string;
}

export interface SettingsResponse {
  pricing: PricingSettings;
  psn: PsnConfig;
}

export interface RefreshSummary {
  new: number;
  updated: number;
  disappeared: number;
  totalSeen: number;
}

export interface ApiError {
  error: string;
  message?: string;
  hint?: string;
}

export interface Filters {
  search: string;
  minDiscount: number;
  onlySelected: boolean;
  hidePublished: boolean;
  sort: "discount" | "price" | "name";
}
