import type { Provider, ProviderSource, RawDeal } from "./types";
import { ProviderError } from "./types";

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 " +
  "(KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36";

const CURRENCY_MAP: Record<string, string> = {
  us: "USD",
  jp: "JPY",
};

async function fetchWithRetry(
  url: string,
  headers?: Record<string, string>
): Promise<Response> {
  let lastError: unknown;
  for (let attempt = 0; attempt < 4; attempt++) {
    try {
      const r = await fetch(url, {
        headers: { "user-agent": UA, ...headers },
      });
      if (r.status === 403 || r.status === 429) {
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

async function fetchJson(url: string, headers?: Record<string, string>): Promise<any> {
  const r = await fetchWithRetry(url, {
    accept: "application/json",
    ...headers,
  });
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  return r.json();
}

async function fetchHtml(url: string): Promise<string> {
  const r = await fetchWithRetry(url, {
    accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "accept-language": "ja",
  });
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  return r.text();
}

async function postJson(url: string, body: any, headers?: Record<string, string>): Promise<any> {
  let lastError: unknown;
  for (let attempt = 0; attempt < 4; attempt++) {
    try {
      const r = await fetch(url, {
        method: "POST",
        headers: {
          "user-agent": UA,
          "content-type": "application/json",
          accept: "application/json",
          ...headers,
        },
        body: JSON.stringify(body),
      });
      if (!r.ok) {
        const text = await r.text().catch(() => "");
        throw new Error(`HTTP ${r.status}: ${text.slice(0, 200)}`);
      }
      return await r.json();
    } catch (e) {
      lastError = e;
      await new Promise((res) => setTimeout(res, 500 * 2 ** attempt));
    }
  }
  throw lastError;
}

// --- US eShop via Algolia (same API the Nintendo website uses) ---

const ALGOLIA_APP_ID = "U3B6GR4UA3";
const ALGOLIA_API_KEY = "a29c6927638bfd8cee23993e51e721c9";
const ALGOLIA_INDEX = "store_game_en_us";

interface AlgoliaHit {
  objectID: string;
  title: string;
  nsuid?: string;
  url?: string;
  productImageSquare?: string;
  productImage?: string;
  platform?: string;
  price?: {
    regPrice?: number;
    salePrice?: number;
    percentOff?: number;
    discounted?: boolean;
  };
  eshopDetails?: {
    discountPriceEnd?: string;
    currency?: string;
  };
}

async function* fetchNintendoUS(): AsyncGenerator<RawDeal> {
  const pageSize = 500;
  let page = 0;
  const maxPages = 20;

  while (page < maxPages) {
    const params = [
      `query=`,
      `hitsPerPage=${pageSize}`,
      `page=${page}`,
      `facetFilters=[["price.discounted:true"]]`,
    ].join("&");

    let data: any;
    try {
      data = await postJson(
        `https://${ALGOLIA_APP_ID}-dsn.algolia.net/1/indexes/${ALGOLIA_INDEX}/query`,
        { params },
        {
          "x-algolia-application-id": ALGOLIA_APP_ID,
          "x-algolia-api-key": ALGOLIA_API_KEY,
        }
      );
    } catch (e) {
      if (page === 0) {
        throw new ProviderError("nintendo", "us", `Algolia request failed: ${(e as Error).message}`);
      }
      break;
    }

    const hits: AlgoliaHit[] = data?.hits ?? [];
    if (hits.length === 0) {
      if (page === 0) {
        const msg = data?.message || `0 hits (nbHits=${data?.nbHits}, status=${data?.status})`;
        throw new ProviderError("nintendo", "us", `Algolia returned no results: ${msg}`);
      }
      break;
    }

    for (const hit of hits) {
      const id = hit.nsuid || hit.objectID;
      const name = hit.title;
      if (!name || !id) continue;

      const price = hit.price;
      if (!price) continue;

      const regPrice = price.regPrice;
      const salePrice = price.salePrice;
      if (regPrice == null && salePrice == null) continue;

      const originalCents = regPrice != null ? Math.round(regPrice * 100) : null;
      const discountedCents =
        salePrice != null ? Math.round(salePrice * 100) : originalCents;

      let discountPercent = price.percentOff ?? 0;
      if (
        !discountPercent &&
        originalCents &&
        discountedCents != null &&
        discountedCents < originalCents
      ) {
        discountPercent = Math.round(
          ((originalCents - discountedCents) * 100) / originalCents
        );
      }

      const imageUrl = hit.productImageSquare || hit.productImage || null;
      const storeUrl = hit.url
        ? `https://www.nintendo.com${hit.url}`
        : `https://www.nintendo.com/us/store/products/${id}/`;

      yield {
        id,
        name,
        imageUrl,
        storeUrl,
        hardwarePlatforms: hit.platform || "Nintendo Switch",
        currency: "USD",
        priceOriginalCents: originalCents,
        priceDiscountedCents: discountedCents,
        discountPercent,
        discountEndAt: hit.eshopDetails?.discountPriceEnd || null,
      };
    }

    const totalPages = data?.nbPages ?? 0;
    page++;
    if (page >= totalPages) break;
  }
}

// --- Japan eShop via store-jp.nintendo.com (SFCC) ---
// Primary: HTML scraping of the official store listing.
// Fallback: search.nintendo.jp JSON API.

function jpYenToCents(s: string | undefined | null): number | null {
  if (!s) return null;
  const cleaned = s.replace(/[^0-9]/g, "");
  const n = parseInt(cleaned, 10);
  if (!Number.isFinite(n) || n === 0) return null;
  // JPY has no decimals; store as yen × 100 for consistency with other currencies
  return n * 100;
}

/** Parse products from the store-jp.nintendo.com HTML listing.
 *  The page embeds product tiles with structured data we can regex-extract. */
function parseJpStoreHtml(html: string): RawDeal[] {
  const deals: RawDeal[] = [];
  const seen = new Set<string>();

  // Strategy 1: Look for JSON-LD product data
  const jsonLdRegex = /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let jsonLdMatch;
  while ((jsonLdMatch = jsonLdRegex.exec(html)) !== null) {
    try {
      const ld = JSON.parse(jsonLdMatch[1]);
      const items = Array.isArray(ld) ? ld : ld["@graph"] ? ld["@graph"] : [ld];
      for (const item of items) {
        if (item["@type"] !== "Product" && item["@type"] !== "VideoGame") continue;
        const id = item.sku || item.productID || item.identifier;
        if (!id || seen.has(id)) continue;
        seen.add(id);
        const offer = Array.isArray(item.offers) ? item.offers[0] : item.offers;
        deals.push({
          id: String(id),
          name: item.name || "",
          imageUrl: item.image || null,
          storeUrl: item.url || `https://store-jp.nintendo.com/item/software/${id}`,
          hardwarePlatforms: "Nintendo Switch",
          currency: "JPY",
          priceOriginalCents: null,
          priceDiscountedCents: jpYenToCents(offer?.price || offer?.lowPrice),
          discountPercent: 0,
          discountEndAt: null,
        });
      }
    } catch { /* ignore malformed JSON-LD */ }
  }

  if (deals.length > 0) return deals;

  // Strategy 2: Extract from embedded __NEXT_DATA__ or similar JSON blobs
  const nextDataMatch = /<script[^>]*id=["']__NEXT_DATA__["'][^>]*>([\s\S]*?)<\/script>/.exec(html);
  if (nextDataMatch) {
    try {
      const data = JSON.parse(nextDataMatch[1]);
      const products = findProductsInTree(data);
      for (const p of products) {
        if (seen.has(p.id)) continue;
        seen.add(p.id);
        deals.push(p);
      }
    } catch { /* ignore */ }
  }

  if (deals.length > 0) return deals;

  // Strategy 3: Regex scrape product tiles from HTML
  // Nintendo JP store tiles typically have data attributes or structured class patterns
  const tileRegex =
    /data-pid=["']([^"']+)["'][\s\S]*?<[^>]*class=["'][^"']*product-name[^"']*["'][^>]*>([^<]+)<[\s\S]*?(?:data-price|class=["'][^"']*price[^"']*["'])[^>]*>([^<]*)</gi;
  let tileMatch;
  while ((tileMatch = tileRegex.exec(html)) !== null) {
    const id = tileMatch[1].trim();
    if (!id || seen.has(id)) continue;
    seen.add(id);
    deals.push({
      id,
      name: tileMatch[2].trim(),
      imageUrl: null,
      storeUrl: `https://store-jp.nintendo.com/item/software/${id}`,
      hardwarePlatforms: "Nintendo Switch",
      currency: "JPY",
      priceOriginalCents: null,
      priceDiscountedCents: jpYenToCents(tileMatch[3]),
      discountPercent: 0,
      discountEndAt: null,
    });
  }

  // Strategy 4: Look for any embedded product JSON arrays
  const jsonArrayRegex = /\[(\{"[^"]*id[^"]*"[:\s]*"[^"]*"[\s\S]*?\}(?:,\s*\{[\s\S]*?\})*)\]/g;
  let arrMatch;
  while ((arrMatch = jsonArrayRegex.exec(html)) !== null) {
    try {
      const arr = JSON.parse("[" + arrMatch[1] + "]");
      for (const item of arr) {
        const id = item.id || item.nsuid || item.productId || item.pid;
        const name = item.title || item.name || item.productName;
        if (!id || !name || seen.has(String(id))) continue;
        seen.add(String(id));
        const price = item.salePrice || item.price || item.discountPrice;
        const origPrice = item.originalPrice || item.regularPrice || item.listPrice;
        deals.push({
          id: String(id),
          name,
          imageUrl: item.image || item.imageUrl || item.thumbnail || null,
          storeUrl: item.url || `https://store-jp.nintendo.com/item/software/${id}`,
          hardwarePlatforms: "Nintendo Switch",
          currency: "JPY",
          priceOriginalCents: jpYenToCents(String(origPrice ?? "")),
          priceDiscountedCents: jpYenToCents(String(price ?? "")),
          discountPercent: parseInt(item.discountRate || item.discountPercent || "0") || 0,
          discountEndAt: null,
        });
      }
    } catch { /* not valid JSON array */ }
  }

  return deals;
}

function findProductsInTree(node: unknown, results: RawDeal[] = []): RawDeal[] {
  if (!node || typeof node !== "object") return results;
  if (Array.isArray(node)) {
    for (const v of node) findProductsInTree(v, results);
    return results;
  }
  const obj = node as Record<string, any>;
  const id = obj.nsuid || obj.id || obj.productId;
  const name = obj.title || obj.name;
  const hasPrice = obj.price != null || obj.salePrice != null || obj.regularPrice != null;
  if (id && name && hasPrice) {
    results.push({
      id: String(id),
      name: String(name),
      imageUrl: obj.image || obj.imageUrl || null,
      storeUrl: obj.url || `https://store-jp.nintendo.com/item/software/${id}`,
      hardwarePlatforms: "Nintendo Switch",
      currency: "JPY",
      priceOriginalCents: jpYenToCents(String(obj.regularPrice ?? obj.originalPrice ?? obj.price ?? "")),
      priceDiscountedCents: jpYenToCents(String(obj.salePrice ?? obj.discountPrice ?? obj.price ?? "")),
      discountPercent: parseInt(obj.discountRate || obj.discountPercent || "0") || 0,
      discountEndAt: null,
    });
  }
  for (const v of Object.values(obj)) findProductsInTree(v, results);
  return results;
}

async function* fetchNintendoJP_Store(): AsyncGenerator<RawDeal> {
  const maxPages = 50;
  const seen = new Set<string>();

  for (let page = 1; page <= maxPages; page++) {
    const url =
      `https://store-jp.nintendo.com/list/software` +
      `?softType=TITLE&isSale=true&srule=most-popular&page=${page}`;

    let html: string;
    try {
      html = await fetchHtml(url);
    } catch {
      break;
    }

    const deals = parseJpStoreHtml(html);
    let newOnPage = 0;
    for (const deal of deals) {
      if (seen.has(deal.id)) continue;
      seen.add(deal.id);
      newOnPage++;

      if (
        deal.priceOriginalCents &&
        deal.priceDiscountedCents &&
        deal.priceDiscountedCents < deal.priceOriginalCents &&
        !deal.discountPercent
      ) {
        deal.discountPercent = Math.round(
          ((deal.priceOriginalCents - deal.priceDiscountedCents) * 100) /
            deal.priceOriginalCents
        );
      }

      yield deal;
    }

    if (newOnPage === 0) break;
  }
}

/** Fallback: search.nintendo.jp JSON API */
async function* fetchNintendoJP_SearchApi(): AsyncGenerator<RawDeal> {
  const pageSize = 300;
  let start = 0;
  const maxItems = 6000;

  while (start < maxItems) {
    const url =
      `https://search.nintendo.jp/nintendo_soft/search.json` +
      `?opt_sshow=1&fq=ssitu_s:onsale+hard_s:1_HAC` +
      `&rows=${pageSize}&start=${start}&sort=score+desc`;

    let data: any;
    try {
      data = await fetchJson(url);
    } catch {
      break;
    }

    const docs = data?.result?.items ?? [];
    if (docs.length === 0) break;

    for (const item of docs) {
      const id = item.nsuid || item.id;
      const name = item.title;
      if (!name || !id) continue;

      const originalCents = jpYenToCents(item.ppri);
      const discountedCents = jpYenToCents(item.spri) ?? originalCents;

      let discountPercent = parseInt(item.dsper) || 0;
      if (
        !discountPercent &&
        originalCents &&
        discountedCents != null &&
        discountedCents < originalCents
      ) {
        discountPercent = Math.round(
          ((originalCents - discountedCents) * 100) / originalCents
        );
      }

      if (!originalCents && !discountedCents) continue;

      const imageUrl = item.iurl || null;
      const storeUrl =
        item.sslurl ||
        `https://store-jp.nintendo.com/item/software/${id}`;

      yield {
        id: String(id),
        name,
        imageUrl,
        storeUrl,
        hardwarePlatforms: "Nintendo Switch",
        currency: "JPY",
        priceOriginalCents: originalCents,
        priceDiscountedCents: discountedCents,
        discountPercent,
        discountEndAt: null,
      };
    }

    start += pageSize;
    const totalCount = data?.result?.total ?? 0;
    if (start >= totalCount) break;
  }
}

async function* fetchNintendoJP(): AsyncGenerator<RawDeal> {
  // Try the official store first, fall back to search API
  let count = 0;
  try {
    for await (const deal of fetchNintendoJP_Store()) {
      count++;
      yield deal;
    }
  } catch { /* store scrape failed */ }

  if (count === 0) {
    // Fallback to search API
    yield* fetchNintendoJP_SearchApi();
  }
}

export const nintendoProvider: Provider = {
  platform: "nintendo",
  async *fetchDeals(source: ProviderSource): AsyncGenerator<RawDeal> {
    const currency = CURRENCY_MAP[source.region];
    if (!currency) {
      throw new ProviderError(
        "nintendo",
        source.region,
        `Región no soportada: ${source.region}`
      );
    }

    if (source.region === "us") {
      yield* fetchNintendoUS();
    } else if (source.region === "jp") {
      yield* fetchNintendoJP();
    }
  },
};
