import type { Provider, ProviderSource, RawDeal } from "./types";
import { ProviderError } from "./types";

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 " +
  "(KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36";

const CC_MAP: Record<string, string> = {
  us: "us",
  br: "br",
  tr: "tr",
};

const CURRENCY_MAP: Record<string, string> = {
  us: "USD",
  br: "BRL",
  tr: "TRY",
};

interface SteamSearchResult {
  name: string;
  logo: string;
  total_count?: number;
  items?: Array<{
    type: string;
    id: number;
    name: string;
    logo: string;
    logo_position: number;
  }>;
}

interface SteamSearchItem {
  name: string;
  logo: string;
}

async function fetchJson(url: string): Promise<any> {
  let lastError: unknown;
  for (let attempt = 0; attempt < 4; attempt++) {
    try {
      const r = await fetch(url, {
        headers: {
          "user-agent": UA,
          accept: "application/json, text/javascript, */*",
        },
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

function parseSteamPrice(priceStr: string | undefined | null): number | null {
  if (!priceStr) return null;
  const s = priceStr.trim();
  if (!s || /^free/i.test(s)) return null;
  const cleaned = s.replace(/[^0-9.,-]/g, "");
  if (!cleaned) return null;
  // Steam formats: "$19.99" (US), "R$ 89,90" (BR), "₺119,99" (TR)
  // Normalize comma-as-decimal (BR, TR)
  const parts = cleaned.split(/[.,]/);
  if (parts.length >= 2) {
    const lastPart = parts[parts.length - 1];
    if (lastPart.length === 2) {
      // Last part is cents/decimals
      const whole = parts.slice(0, -1).join("");
      const n = Number(whole + "." + lastPart);
      if (Number.isFinite(n)) return Math.round(n * 100);
    }
  }
  // Fallback: try parsing as-is
  const n = Number(cleaned.replace(/,/g, "."));
  if (Number.isFinite(n)) return Math.round(n * 100);
  return null;
}

interface SteamSearchResultItem {
  name: string;
  appid: string;
}

async function* fetchSteamDeals(
  cc: string,
  currency: string,
  region: string
): AsyncGenerator<RawDeal> {
  const pageSize = 100;
  const maxPages = 30;
  const seen = new Set<string>();

  for (let page = 0; page < maxPages; page++) {
    const start = page * pageSize;
    const url =
      `https://store.steampowered.com/search/results/?query&start=${start}` +
      `&count=${pageSize}&dynamic_data=&sort_by=_ASC&specials=1` +
      `&snr=1_7_7_230_7&infinite=1&cc=${cc}`;

    let data: any;
    try {
      data = await fetchJson(url);
    } catch {
      break;
    }

    const html: string = data?.results_html ?? "";
    if (!html || html.trim() === "") break;

    // Parse the HTML snippets for app IDs + names
    // Steam search returns HTML fragments with data-ds-appid attributes
    const appRegex =
      /data-ds-appid="(\d+)"[\s\S]*?<span class="title">([^<]+)<\/span>[\s\S]*?<div class="discount_pct">([^<]*)<\/div>[\s\S]*?<div class="discount_original_price">([^<]*)<\/div>[\s\S]*?<div class="discount_final_price">([^<]*)<\/div>/g;

    let match;
    let foundOnPage = 0;
    while ((match = appRegex.exec(html)) !== null) {
      const appId = match[1];
      if (seen.has(appId)) continue;
      seen.add(appId);
      foundOnPage++;

      const name = match[2].trim();
      const discountPctStr = match[3].trim().replace(/[-%]/g, "");
      const originalPriceStr = match[4].trim();
      const finalPriceStr = match[5].trim();

      const discountPercent = parseInt(discountPctStr) || 0;
      const originalCents = parseSteamPrice(originalPriceStr);
      const discountedCents = parseSteamPrice(finalPriceStr);

      if (!originalCents && !discountedCents) continue;

      yield {
        id: appId,
        name,
        imageUrl: `https://cdn.akamai.steamstatic.com/steam/apps/${appId}/header.jpg`,
        storeUrl: `https://store.steampowered.com/app/${appId}/`,
        hardwarePlatforms: "PC",
        currency,
        priceOriginalCents: originalCents,
        priceDiscountedCents: discountedCents ?? originalCents,
        discountPercent,
        discountEndAt: null,
      };
    }

    // Also try simpler format (some results show differently)
    const simpleRegex =
      /data-ds-appid="(\d+)"[\s\S]*?<span class="title">([^<]+)<\/span>/g;
    // Only process entries we haven't seen yet
    simpleRegex.lastIndex = 0;

    const totalCount = data?.total_count ?? 0;
    if (start + pageSize >= totalCount || foundOnPage === 0) break;
  }
}

export const steamProvider: Provider = {
  platform: "steam",
  async *fetchDeals(source: ProviderSource): AsyncGenerator<RawDeal> {
    const cc = CC_MAP[source.region];
    const currency = CURRENCY_MAP[source.region];
    if (!cc || !currency) {
      throw new ProviderError(
        "steam",
        source.region,
        `Región no soportada: ${source.region}`
      );
    }

    yield* fetchSteamDeals(cc, currency, source.region);
  },
};
