import type { Provider, ProviderSource, RawDeal } from "./types";
import { ProviderError } from "./types";

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 " +
  "(KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36";

const CURRENCY_MAP: Record<string, string> = {
  us: "USD",
  jp: "JPY",
};

async function fetchJson(url: string, headers?: Record<string, string>): Promise<any> {
  let lastError: unknown;
  for (let attempt = 0; attempt < 4; attempt++) {
    try {
      const r = await fetch(url, {
        headers: { "user-agent": UA, accept: "application/json", ...headers },
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
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
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
const ALGOLIA_API_KEY = "c4da8be7fd29f0f5bfa42920b0a99dc7";

interface AlgoliaHit {
  objectID: string;
  title: string;
  nsuid?: string;
  url?: string;
  horizontalHeaderImage?: string;
  boxart?: string;
  platform?: string;
  msrp?: number;
  salePrice?: number;
  lowestPrice?: number;
  percentOff?: number;
  availability?: string[];
}

async function* fetchNintendoUS(): AsyncGenerator<RawDeal> {
  const pageSize = 500;
  let page = 0;
  const maxPages = 20;

  while (page < maxPages) {
    const body = {
      requests: [
        {
          indexName: "noa_aem_game_en_us_title_asc",
          params: [
            `query=`,
            `hitsPerPage=${pageSize}`,
            `page=${page}`,
            `facetFilters=[["availability:On sale"]]`,
            `facets=["platform","availability"]`,
          ].join("&"),
        },
      ],
    };

    let data: any;
    try {
      data = await postJson(
        `https://${ALGOLIA_APP_ID}-dsn.algolia.net/1/indexes/*/queries`,
        body,
        {
          "x-algolia-application-id": ALGOLIA_APP_ID,
          "x-algolia-api-key": ALGOLIA_API_KEY,
        }
      );
    } catch {
      break;
    }

    const results = data?.results?.[0];
    const hits: AlgoliaHit[] = results?.hits ?? [];
    if (hits.length === 0) break;

    for (const hit of hits) {
      const id = hit.nsuid || hit.objectID;
      const name = hit.title;
      if (!name || !id) continue;

      const msrp = hit.msrp;
      const sale = hit.salePrice ?? hit.lowestPrice;
      if (msrp == null && sale == null) continue;

      const originalCents = msrp != null ? Math.round(msrp * 100) : null;
      const discountedCents =
        sale != null ? Math.round(sale * 100) : originalCents;

      let discountPercent = hit.percentOff ?? 0;
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

      const imageUrl = hit.horizontalHeaderImage || hit.boxart || null;
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
        discountEndAt: null,
      };
    }

    const totalPages = results?.nbPages ?? 0;
    page++;
    if (page >= totalPages) break;
  }
}

// --- Japan eShop via Nintendo's search API ---

interface JpSearchItem {
  id: string;
  title: string;
  nsuid?: string;
  hard?: string;
  iurl?: string;
  ppri?: string;
  spri?: string;
  dsper?: string;
  sslurl?: string;
  ssitu?: string;
}

function jpPriceToCents(s: string | undefined | null): number | null {
  if (!s) return null;
  const cleaned = s.replace(/[^0-9]/g, "");
  const n = parseInt(cleaned, 10);
  if (!Number.isFinite(n)) return null;
  // JPY has no decimals, but we store in "cents" (= yen * 100) for consistency
  return n * 100;
}

async function* fetchNintendoJP(): AsyncGenerator<RawDeal> {
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

      const originalCents = jpPriceToCents(item.ppri);
      const discountedCents = jpPriceToCents(item.spri) ?? originalCents;

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
