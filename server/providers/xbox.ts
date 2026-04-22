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

async function fetchWithRetry(url: string, init?: RequestInit): Promise<Response> {
  let lastError: unknown;
  for (let attempt = 0; attempt < 4; attempt++) {
    try {
      const r = await fetch(url, {
        headers: { "user-agent": UA, accept: "application/json" },
        ...init,
      });
      if (r.status === 429) {
        await new Promise((res) => setTimeout(res, 1000 * 2 ** attempt));
        continue;
      }
      return r;
    } catch (e) {
      lastError = e;
      await new Promise((res) => setTimeout(res, 500 * 2 ** attempt));
    }
  }
  throw lastError;
}

async function fetchJson(url: string): Promise<any> {
  const r = await fetchWithRetry(url);
  if (!r.ok) {
    const text = await r.text().catch(() => "");
    throw new Error(`HTTP ${r.status}: ${text.slice(0, 200)}`);
  }
  return r.json();
}

/** Recursively walk a JSON tree looking for Xbox product IDs (12-char alphanumeric starting with 9). */
function extractIdsFromTree(node: unknown, seen: Set<string>, ids: string[]): void {
  if (!node || typeof node !== "object") {
    if (typeof node === "string" && /^9[A-Z0-9]{11}$/.test(node) && !seen.has(node)) {
      seen.add(node);
      ids.push(node);
    }
    return;
  }
  if (Array.isArray(node)) {
    for (const v of node) extractIdsFromTree(v, seen, ids);
    return;
  }
  for (const v of Object.values(node as Record<string, unknown>)) {
    extractIdsFromTree(v, seen, ids);
  }
}

// Try multiple endpoints to get deal product IDs.
// Primary: reco-public (Microsoft Recommendations API)
// Fallback: catalog.gamepass.com/sigls (Game Pass signals — contains deal lists)
async function fetchDealIds(
  market: string,
  language: string
): Promise<string[]> {
  const errors: string[] = [];

  // Attempt 1: Reco API
  try {
    const url =
      `https://reco-public.rec.mp.microsoft.com/channels/Reco/V8.0/Lists/Computed/Deal` +
      `?Market=${market}&Language=${language}&ItemTypes=Game` +
      `&deviceFamily=Windows.Xbox&count=2000&skipitems=0`;
    const data = await fetchJson(url);
    const items: Array<{ Id: string }> = data?.Items ?? [];
    const ids = items.map((it) => it.Id).filter(Boolean);
    if (ids.length > 0) return ids;
  } catch (e) {
    errors.push(`Reco: ${(e as Error).message}`);
  }

  // Attempt 2: Xbox catalog deals via sigls (signal lists)
  // Deal list ID known from Xbox website source
  const DEAL_LIST_ID = "f6f1f99f-9b49-4ccd-b3bf-4d9767a77f5e";
  try {
    const url =
      `https://catalog.gamepass.com/sigls/v2` +
      `?id=${DEAL_LIST_ID}&language=${language.split("-")[0]}&market=${market}`;
    const data = await fetchJson(url);
    const items: Array<{ id?: string }> = Array.isArray(data) ? data : [];
    const ids = items.map((it) => it.id).filter((id): id is string => !!id);
    if (ids.length > 0) return ids;
  } catch (e) {
    errors.push(`Sigls: ${(e as Error).message}`);
  }

  // Attempt 3: Search displaycatalog for games with deals
  try {
    const url =
      `https://displaycatalog.mp.microsoft.com/v7.0/products/search` +
      `?query=deal&market=${market}&languages=${language}` +
      `&fieldsTemplate=details&top=200`;
    const data = await fetchJson(url);
    const products: CatalogProduct[] = data?.Products ?? [];
    const ids = products.map((p) => p.ProductId).filter(Boolean);
    if (ids.length > 0) return ids;
  } catch (e) {
    errors.push(`Search: ${(e as Error).message}`);
  }

  // Attempt 4: HTML fallback — scrape xbox.com deals page for product IDs
  try {
    const browseUrl =
      `https://www.xbox.com/en-US/games/browse?FilteredByIds=DynamicChannel.GameDeals`;
    const r = await fetchWithRetry(browseUrl, {
      headers: {
        "user-agent": UA,
        accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "accept-language": language,
      },
    });
    if (!r.ok) {
      throw new Error(`HTTP ${r.status}`);
    }
    const html = await r.text();
    const ids: string[] = [];
    const seen = new Set<string>();

    // Strategy A: Parse __NEXT_DATA__ JSON blob for product IDs
    const nextDataMatch = /<script[^>]*id=["']__NEXT_DATA__["'][^>]*>([\s\S]*?)<\/script>/.exec(html);
    if (nextDataMatch) {
      try {
        const nextData = JSON.parse(nextDataMatch[1]);
        extractIdsFromTree(nextData, seen, ids);
      } catch { /* malformed JSON */ }
    }

    // Strategy B: Look for 12-character alphanumeric product IDs in data attributes
    if (ids.length === 0) {
      const attrRegex = /data-[a-z-]*id=["']([A-Z0-9]{12})["']/gi;
      let attrMatch;
      while ((attrMatch = attrRegex.exec(html)) !== null) {
        const id = attrMatch[1];
        if (!seen.has(id)) {
          seen.add(id);
          ids.push(id);
        }
      }
    }

    // Strategy C: Find any 12-char uppercase alphanumeric strings that look like Xbox product IDs
    if (ids.length === 0) {
      const idRegex = /\b(9[A-Z0-9]{11})\b/g;
      let idMatch;
      while ((idMatch = idRegex.exec(html)) !== null) {
        const id = idMatch[1];
        if (!seen.has(id)) {
          seen.add(id);
          ids.push(id);
        }
      }
    }

    if (ids.length > 0) return ids;
    errors.push(`HTML scrape: found 0 product IDs in ${html.length} bytes of HTML`);
  } catch (e) {
    errors.push(`HTML scrape: ${(e as Error).message}`);
  }

  throw new Error(`All Xbox deal endpoints failed: ${errors.join(" | ")}`);
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
