import type { Provider, ProviderSource, RawDeal } from "./types";
import { ProviderError } from "./types";

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 " +
  "(KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36";

const MARKET_MAP: Record<string, string> = {
  us: "US",
  br: "BR",
  tr: "TR",
};

const LANG_MAP: Record<string, string> = {
  us: "en-US",
  br: "pt-BR",
  tr: "tr-TR",
};

const CURRENCY_MAP: Record<string, string> = {
  us: "USD",
  br: "BRL",
  tr: "TRY",
};

interface RecoItem {
  Id: string;
  Title?: string;
  ImageUrl?: string;
}

interface CatalogProduct {
  ProductId: string;
  LocalizedProperties?: Array<{
    ProductTitle?: string;
    Images?: Array<{ ImagePurpose?: string; Uri?: string }>;
  }>;
  DisplaySkuAvailabilities?: Array<{
    Sku?: { Properties?: { FulfillmentData?: { PlatformDependencyInfo?: string } } };
    Availabilities?: Array<{
      Conditions?: { EndDate?: string };
      OrderManagementData?: {
        Price?: {
          ListPrice?: number;
          MSRP?: number;
          WholesalePrice?: number;
          CurrencyCode?: string;
        };
      };
    }>;
  }>;
  Properties?: {
    Categories?: string[];
    Category?: string;
  };
}

function toCents(price: number | undefined | null): number | null {
  if (price == null || !Number.isFinite(price)) return null;
  return Math.round(price * 100);
}

async function fetchJson(url: string): Promise<any> {
  let lastError: unknown;
  for (let attempt = 0; attempt < 4; attempt++) {
    try {
      const r = await fetch(url, {
        headers: { "user-agent": UA, accept: "application/json" },
      });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      return await r.json();
    } catch (e) {
      lastError = e;
      await new Promise((res) => setTimeout(res, 500 * 2 ** attempt));
    }
  }
  throw lastError;
}

async function fetchDealIds(
  market: string,
  language: string
): Promise<string[]> {
  const url =
    `https://reco-public.rec.mp.microsoft.com/channels/Reco/V8.0/Lists/Computed/Deal` +
    `?Market=${market}&Language=${language}&ItemTypes=Game` +
    `&deviceFamily=Windows.Xbox&count=2000&skipitems=0`;
  const data = await fetchJson(url);
  const items: RecoItem[] = data?.Items ?? [];
  return items.map((it) => it.Id).filter(Boolean);
}

async function fetchProductDetails(
  ids: string[],
  market: string,
  language: string
): Promise<CatalogProduct[]> {
  const batchSize = 20;
  const all: CatalogProduct[] = [];
  for (let i = 0; i < ids.length; i += batchSize) {
    const batch = ids.slice(i, i + batchSize);
    const url =
      `https://displaycatalog.mp.microsoft.com/v7.0/products` +
      `?bigIds=${batch.join(",")}&market=${market}&languages=${language}` +
      `&MS-CV=DGU1mcuYo0WMMp+F.1`;
    try {
      const data = await fetchJson(url);
      const products: CatalogProduct[] = data?.Products ?? [];
      all.push(...products);
    } catch {
      // Skip failed batch, continue with rest
    }
  }
  return all;
}

function extractGameData(
  product: CatalogProduct,
  region: string
): RawDeal | null {
  const id = product.ProductId;
  if (!id) return null;

  const lp = product.LocalizedProperties?.[0];
  const name = lp?.ProductTitle;
  if (!name) return null;

  let imageUrl: string | null = null;
  const images = lp?.Images ?? [];
  const hero = images.find(
    (img) => img.ImagePurpose === "SuperHeroArt" || img.ImagePurpose === "Poster"
  );
  const boxArt = images.find((img) => img.ImagePurpose === "BoxArt");
  const anyImg = images[0];
  const chosen = hero || boxArt || anyImg;
  if (chosen?.Uri) {
    imageUrl = chosen.Uri.startsWith("//")
      ? "https:" + chosen.Uri
      : chosen.Uri;
  }

  const dsa = product.DisplaySkuAvailabilities?.[0];
  const avails = dsa?.Availabilities ?? [];

  let listPrice: number | null = null;
  let salePrice: number | null = null;
  let endDate: string | null = null;
  const currency = CURRENCY_MAP[region] || "USD";

  for (const a of avails) {
    const p = a.OrderManagementData?.Price;
    if (!p) continue;
    const msrp = p.MSRP ?? p.ListPrice;
    const sale = p.ListPrice ?? p.WholesalePrice;
    if (msrp != null && listPrice == null) listPrice = msrp;
    if (sale != null && sale < (msrp ?? Infinity)) {
      salePrice = sale;
      endDate = a.Conditions?.EndDate ?? null;
    }
  }

  if (listPrice == null && salePrice == null) return null;

  const originalCents = toCents(listPrice);
  const discountedCents = toCents(salePrice) ?? originalCents;
  let discountPercent = 0;
  if (
    originalCents &&
    discountedCents != null &&
    discountedCents < originalCents
  ) {
    discountPercent = Math.round(
      ((originalCents - discountedCents) * 100) / originalCents
    );
  }

  const market = MARKET_MAP[region] || "US";
  const storeUrl = `https://www.xbox.com/${market.toLowerCase()}/games/store/${encodeURIComponent(name.toLowerCase().replace(/\s+/g, "-"))}/${id}`;

  return {
    id,
    name,
    imageUrl,
    storeUrl,
    hardwarePlatforms: "Xbox Series X|S, Xbox One",
    currency,
    priceOriginalCents: originalCents,
    priceDiscountedCents: discountedCents,
    discountPercent,
    discountEndAt: endDate,
  };
}

export const xboxProvider: Provider = {
  platform: "xbox",
  async *fetchDeals(source: ProviderSource): AsyncGenerator<RawDeal> {
    const market = MARKET_MAP[source.region];
    const language = LANG_MAP[source.region];
    if (!market || !language) {
      throw new ProviderError("xbox", source.region, `Región no soportada: ${source.region}`);
    }

    const ids = await fetchDealIds(market, language);
    if (ids.length === 0) return;

    const products = await fetchProductDetails(ids, market, language);

    for (const product of products) {
      const deal = extractGameData(product, source.region);
      if (deal && deal.discountPercent > 0) {
        yield deal;
      }
    }
  },
};
