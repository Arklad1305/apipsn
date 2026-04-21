export type Platform = "psn" | "xbox" | "nintendo" | "steam";

export const PLATFORM_LABELS: Record<Platform, string> = {
  psn: "PlayStation",
  xbox: "Xbox",
  nintendo: "Nintendo",
  steam: "Steam",
};

export interface RegionConfig {
  code: string;
  label: string;
  currency: string;
  locale: string;
}

export const PLATFORM_REGIONS: Record<Platform, RegionConfig[]> = {
  psn: [
    { code: "us", label: "US", currency: "USD", locale: "en-US" },
    { code: "br", label: "Brasil", currency: "BRL", locale: "pt-BR" },
  ],
  xbox: [
    { code: "us", label: "US", currency: "USD", locale: "en-US" },
    { code: "br", label: "Brasil", currency: "BRL", locale: "pt-BR" },
    { code: "tr", label: "Turquía", currency: "TRY", locale: "tr-TR" },
  ],
  nintendo: [
    { code: "us", label: "US", currency: "USD", locale: "en-US" },
    { code: "jp", label: "Japón", currency: "JPY", locale: "ja" },
  ],
  steam: [
    { code: "us", label: "US", currency: "USD", locale: "en" },
    { code: "br", label: "Brasil", currency: "BRL", locale: "brazilian" },
    { code: "tr", label: "Turquía", currency: "TRY", locale: "turkish" },
  ],
};

export interface RawDeal {
  id: string;
  name: string;
  imageUrl: string | null;
  storeUrl: string | null;
  hardwarePlatforms: string;
  currency: string;
  priceOriginalCents: number | null;
  priceDiscountedCents: number | null;
  discountPercent: number;
  discountEndAt: string | null;
}

export interface ProviderSource {
  platform: Platform;
  region: string;
  enabled: boolean;
  categoryId?: string;
}

export interface Provider {
  platform: Platform;
  fetchDeals(source: ProviderSource): AsyncGenerator<RawDeal>;
}

export class ProviderError extends Error {
  constructor(
    public platform: Platform,
    public region: string,
    message: string
  ) {
    super(`[${platform}/${region}] ${message}`);
  }
}
