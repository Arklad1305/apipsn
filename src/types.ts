export type Platform = "psn" | "xbox" | "nintendo" | "steam";

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
  dbKey: string;
  platform: Platform;
  region: string;
  currency: string;
  name: string;
  imageUrl: string | null;
  storeUrl: string | null;
  platforms: string;
  priceOriginal: number | null;
  priceDiscounted: number | null;
  /** @deprecated Use priceOriginal */
  priceOriginalUsd: number | null;
  /** @deprecated Use priceDiscounted */
  priceDiscountedUsd: number | null;
  discountPercent: number;
  discountEndAt: string | null;
  selected: boolean;
  published: boolean;
  notes: string;
  youtubeUrl: string;
  active: boolean;
  costClp: number | null;
  primaria1: number | null;
  primaria2: number | null;
  secundaria: number | null;
  marketMin: number | null;
  marketCount: number;
  marketMatches: CompetitorMatchOut[];
}

export type CompetitorType = "shopify" | "woocommerce" | "html" | "jumpseller" | "auto";

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
  brlToClp: number;
  tryToClp: number;
  jpyToClp: number;
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

export interface ProviderSource {
  platform: Platform;
  region: string;
  enabled: boolean;
  categoryId?: string;
  url?: string;
}

export interface SettingsResponse {
  pricing: PricingSettings;
  psn: PsnConfig;
  sources: ProviderSource[];
}

export interface WatchlistAlert {
  id: string;
  name: string;
  discountPercent: number;
  priceDiscountedUsd: number | null;
  storeUrl: string | null;
}

export interface SourceResult {
  platform: string;
  region: string;
  newCount: number;
  updated: number;
  disappeared: number;
  totalSeen: number;
  error?: string;
}

export interface RefreshSummary {
  new: number;
  updated: number;
  disappeared: number;
  totalSeen: number;
  kept: number;
  filteredAddOns: number;
  watchlistAlerts: WatchlistAlert[];
  sourceResults?: SourceResult[];
}

export interface WatchedGame {
  id: string;
  name: string;
  addedAt: string;
  lastStatus: "unseen" | "on_sale" | "off_sale";
  lastSeenOnSaleAt: string | null;
  lastPriceCents: number | null;
  lastDiscountPercent: number;
  notes: string;
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
  contentDescriptors: string[];
  interactiveElements: string[];
  playerCount: string | null;
  onlinePlayerCount: string | null;
  psPlusRequired: boolean;
  inGamePurchases: string | null;
  gameFeatures: string[];
  psVersion: string | null;
  fileSize: string | null;
  platforms: string;
  media: ProductMedia;
  carouselImages: string[];
  storeUrl: string;
  discountEndAt: string | null;
  fetchedAt: string;
}

export type PlusTier = "essential" | "extra" | "premium";
export type PlusDuration = "1m" | "3m" | "12m";
export type PlusRegion = "us" | "br" | "tr";

export interface PlusRegionPrice {
  region: PlusRegion;
  currency: string;
  price: number;
  priceClp: number | null;
}

export interface PlusPlanWithMatches {
  tier: PlusTier;
  duration: PlusDuration;
  label: string;
  regionPrices: PlusRegionPrice[];
  cheapestRegion: PlusRegion | null;
  cheapestClp: number | null;
  searchTerms: string[];
  competitorMatches: CompetitorMatchOut[];
  bestPrice: number | null;
  bestStore: string | null;
}

export interface LookupItem {
  name: string;
  priceMin: number | null;
  priceMax: number | null;
}

export interface LookupResult {
  query: string;
  priceMin: number | null;
  priceMax: number | null;
  matchScore: number;
  found: boolean;
  game: GameOut | null;
}

export interface Filters {
  search: string;
  minDiscount: number;
  onlySelected: boolean;
  hidePublished: boolean;
  onlyWithMarket: boolean;
  platform: Platform | "";
  sort: "discount" | "price" | "name" | "market";
}

export interface RegionConfig {
  code: string;
  label: string;
  currency: string;
  locale: string;
}

export interface PlatformMeta {
  labels: Record<Platform, string>;
  regions: Record<Platform, RegionConfig[]>;
}

export const PLATFORM_LABELS: Record<Platform, string> = {
  psn: "PlayStation",
  xbox: "Xbox",
  nintendo: "Nintendo",
  steam: "Steam",
};

export const PLATFORM_ICONS: Record<Platform, string> = {
  psn: "PS",
  xbox: "XB",
  nintendo: "NS",
  steam: "ST",
};

export const CURRENCY_SYMBOLS: Record<string, string> = {
  USD: "$",
  BRL: "R$",
  TRY: "₺",
  JPY: "¥",
  CLP: "$",
};
