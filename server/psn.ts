/**
 * PSN Store scraper.
 *
 * PSN now server-side-renders the category pages (Next.js). The product grid
 * is embedded as JSON inside a `<script id="__NEXT_DATA__">` tag — we fetch
 * the HTML and parse that blob instead of hitting the GraphQL endpoint with
 * persisted queries. No sha256 hashes to keep up to date.
 *
 *   GET https://store.playstation.com/<region>/category/<categoryId>/<page>
 *
 * We paginate by walking /1, /2, /3 until a page returns no new products.
 */
import type { Game, PsnConfig } from "./store";

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 " +
  "(KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36";

/** Kept for API compatibility with the old client; no longer thrown. */
export class PersistedQueryNotFoundError extends Error {
  constructor() {
    super("PSN persisted query hash is stale.");
  }
}

export class PsnApiError extends Error {}

function priceToCents(v: unknown): number | null {
  if (v == null) return null;
  const s = String(v).trim();
  if (!s || /^free$/i.test(s) || /^gratis$/i.test(s)) return null;
  const cleaned = s.replace(/[^0-9.,-]/g, "").replace(/,/g, ".");
  const parts = cleaned.split(".");
  const norm =
    parts.length > 2 ? parts.slice(0, -1).join("") + "." + parts.at(-1) : cleaned;
  const n = Number(norm);
  if (!Number.isFinite(n)) return null;
  return Math.round(n * 100);
}

interface RawProduct {
  id?: string;
  productId?: string;
  conceptId?: string;
  name?: string;
  title?: string;
  platforms?: string[] | string;
  media?: Array<{ role?: string; url?: string; type?: string }> | null;
  webctas?: Array<{
    price?: {
      basePriceValue?: string;
      basePrice?: string;
      discountedValue?: string;
      discountedPrice?: string;
      discountText?: string;
      endTime?: string;
    };
  }> | null;
  price?: {
    basePriceValue?: string;
    basePrice?: string;
    discountedValue?: string;
    discountedPrice?: string;
    discountText?: string;
    endTime?: string;
  };
}

export function normalizeProduct(raw: RawProduct, now: string): Game | null {
  const id = raw.id || raw.productId || raw.conceptId;
  if (!id) return null;

  const name = raw.name || raw.title || "";
  if (!name) return null;

  // Image: prefer hero/master/boxart if available.
  let imageUrl: string | null = null;
  const media = raw.media || [];
  for (const m of media) {
    const role = String(m?.role || "").toUpperCase();
    if (
      ["MASTER", "PREVIEW_GAME_ART", "BOXART", "GAMEHUB_COVER_ART"].includes(role)
    ) {
      imageUrl = m.url ?? null;
      if (imageUrl) break;
    }
  }
  if (!imageUrl && media[0]?.url) imageUrl = media[0].url;

  const platforms = Array.isArray(raw.platforms)
    ? raw.platforms.join(",")
    : raw.platforms ?? "";

  const price = raw.webctas?.[0]?.price ?? raw.price ?? {};
  const priceOriginalCents = priceToCents(price.basePriceValue ?? price.basePrice);
  let priceDiscountedCents = priceToCents(
    price.discountedValue ?? price.discountedPrice
  );
  if (priceDiscountedCents == null) priceDiscountedCents = priceOriginalCents;

  let discountPercent = 0;
  const dt = price.discountText || "";
  const m = /(\d+)/.exec(String(dt));
  if (m) discountPercent = parseInt(m[1], 10);
  if (
    !discountPercent &&
    priceOriginalCents &&
    priceDiscountedCents != null &&
    priceOriginalCents > 0 &&
    priceDiscountedCents < priceOriginalCents
  ) {
    discountPercent = Math.round(
      ((priceOriginalCents - priceDiscountedCents) * 100) / priceOriginalCents
    );
  }

  return {
    id: String(id),
    name,
    imageUrl,
    storeUrl: `https://store.playstation.com/en-us/product/${id}`,
    platforms,
    priceOriginalCents,
    priceDiscountedCents,
    discountPercent,
    discountEndAt: price.endTime || null,
    selected: false,
    published: false,
    notes: "",
    active: true,
    firstSeenAt: now,
    lastSeenAt: now,
    updatedAt: now,
  };
}

async function fetchHtml(url: string, region: string): Promise<string> {
  let lastError: unknown = null;
  for (let attempt = 0; attempt < 4; attempt++) {
    try {
      const r = await fetch(url, {
        headers: {
          "user-agent": UA,
          accept:
            "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
          "accept-language": region.toLowerCase().startsWith("es") ? "es" : "en-US",
          "x-psn-store-locale-override": region,
        },
      });
      if (r.status === 404) throw new PsnApiError(`Category not found (404): ${url}`);
      if (r.status === 403)
        throw new PsnApiError("PSN returned 403 (IP/Cloudflare block)");
      if (r.status >= 500) throw new Error(`PSN ${r.status}`);
      return await r.text();
    } catch (e) {
      if (e instanceof PsnApiError) throw e;
      lastError = e;
      await new Promise((res) => setTimeout(res, 500 * 2 ** attempt));
    }
  }
  throw new PsnApiError(
    `PSN HTML fetch failed after retries: ${(lastError as Error)?.message || lastError}`
  );
}

/** Extract the JSON payload from `<script id="__NEXT_DATA__">…</script>`. */
function extractNextData(html: string): any | null {
  const m = /<script[^>]*id=["']__NEXT_DATA__["'][^>]*>([\s\S]*?)<\/script>/.exec(
    html
  );
  if (!m) return null;
  try {
    return JSON.parse(m[1]);
  } catch {
    return null;
  }
}

/**
 * Recursively walk a JSON tree and collect anything that looks like a PSN
 * product entry. Matches objects with an `id`/`productId` plus either a
 * `name`/`title` and a `price`/`webctas`.
 */
function collectProducts(node: unknown, out: Map<string, RawProduct>): void {
  if (!node) return;
  if (Array.isArray(node)) {
    for (const v of node) collectProducts(v, out);
    return;
  }
  if (typeof node !== "object") return;
  const obj = node as Record<string, unknown>;

  const id = (obj.id || obj.productId || obj.conceptId) as string | undefined;
  const name = (obj.name || obj.title) as string | undefined;
  const hasPrice =
    (obj.price && typeof obj.price === "object") ||
    (Array.isArray(obj.webctas) && obj.webctas.length > 0);
  // Product IDs on PSN look like "UP9000-CUSA07408_00-REDEMPTION2000000"
  // (contain a hyphen + underscore). Filter on that to avoid picking up
  // arbitrary entities with an `id`.
  if (
    id &&
    typeof id === "string" &&
    /^[A-Z]{2}\d{4}-/.test(id) &&
    name &&
    hasPrice &&
    !out.has(id)
  ) {
    out.set(id, obj as RawProduct);
  }

  for (const v of Object.values(obj)) collectProducts(v, out);
}

function buildCategoryUrl(cfg: PsnConfig, page: number): string {
  // region like "en-US" → "en-us"
  const regionPath = cfg.region.toLowerCase();
  return `https://store.playstation.com/${regionPath}/category/${cfg.dealsCategoryId}/${page}`;
}

export async function* iterCategoryProducts(
  cfg: PsnConfig
): AsyncGenerator<RawProduct> {
  const seen = new Set<string>();
  const maxPages = 50; // hard stop so a bug can't loop forever

  for (let page = 1; page <= maxPages; page++) {
    const url = buildCategoryUrl(cfg, page);
    const html = await fetchHtml(url, cfg.region);
    const data = extractNextData(html);
    if (!data) {
      if (page === 1) {
        throw new PsnApiError(
          "Could not find __NEXT_DATA__ in PSN HTML — page layout may have changed."
        );
      }
      break;
    }
    const found = new Map<string, RawProduct>();
    collectProducts(data, found);

    let newOnThisPage = 0;
    for (const [id, p] of found) {
      if (seen.has(id)) continue;
      seen.add(id);
      newOnThisPage++;
      yield p;
    }
    if (newOnThisPage === 0) break; // pagination exhausted
  }
}
