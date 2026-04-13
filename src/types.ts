export interface CompetitorMatchOut {
  storeKey: string;
  title: string;
  url: string;
  priceClp: number;
  available: boolean;
  score: number;
}

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
  marketMin: number | null;
  marketCount: number;
  marketMatches: CompetitorMatchOut[];
}

export type CompetitorType = "shopify" | "woocommerce" | "html" | "auto";

export interface CompetitorConfig {
  key: string;
  label: string;
  domain: string;
  type: CompetitorType;
  enabled: boolean;
}

export interface CompetitorStatus extends CompetitorConfig {
  refreshedAt: string | null;
  productCount: number;
}

export interface CompetitorRefreshResult {
  refreshedAt: string;
  results: Array<{
    key: string;
    label: string;
    count: number;
    error?: string;
  }>;
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
  includeAddOns: boolean;
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
  kept: number;
  filteredAddOns: number;
}

export interface ApiError {
  error: string;
  message?: string;
  hint?: string;
}

export interface ProductMedia {
  heroUrl: string | null;
  logoUrl: string | null;
  backgroundUrl: string | null;
  coverUrl: string | null;
  screenshots: string[];
  videos: Array<{ url: string; posterUrl: string | null; mimeType: string | null }>;
}

export interface ProductDetail {
  id: string;
  name: string;
  description: string;
  shortDescription: string | null;
  publisher: string | null;
  developer: string | null;
  releaseDate: string | null;
  genres: string[];
  voiceLanguages: string[];
  subtitleLanguages: string[];
  ageRating: string | null;
  fileSize: string | null;
  platforms: string;
  media: ProductMedia;
  storeUrl: string;
  fetchedAt: string;
}

export interface Filters {
  search: string;
  minDiscount: number;
  onlySelected: boolean;
  hidePublished: boolean;
  onlyWithMarket: boolean;
  sort: "discount" | "price" | "name" | "market";
}
