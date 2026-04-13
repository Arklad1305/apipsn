/**
 * PSN Store GraphQL client using the persisted-query pattern.
 *
 *   GET https://web.np.playstation.com/api/graphql/v1/op
 *       ?operationName=categoryGridRetrieve
 *       &variables=<json>
 *       &extensions={"persistedQuery":{"version":1,"sha256Hash":"<hash>"}}
 *
 * When the SHA256 hash is stale PSN returns PERSISTED_QUERY_NOT_FOUND — the
 * caller must fetch the new hash from DevTools and update config.
 */
import type { Game, PsnConfig } from "./store";

const PSN_GRAPHQL_URL = "https://web.np.playstation.com/api/graphql/v1/op";
const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 " +
  "(KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36";

export class PersistedQueryNotFoundError extends Error {
  constructor() {
    super("PSN persisted query hash is stale. Update the hash in Ajustes.");
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
  media?: Array<{ role?: string; url?: string }> | null;
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
}

export function normalizeProduct(raw: RawProduct, now: string): Game | null {
  const id = raw.id || raw.productId || raw.conceptId;
  if (!id) return null;

  const name = raw.name || raw.title || "";

  // Image: prefer hero/master/boxart if available.
  let imageUrl: string | null = null;
  const media = raw.media || [];
  for (const m of media) {
    if (
      m?.role &&
      ["MASTER", "PREVIEW_GAME_ART", "BOXART", "GAMEHUB_COVER_ART"].includes(m.role)
    ) {
      imageUrl = m.url ?? null;
      if (imageUrl) break;
    }
  }
  if (!imageUrl && media[0]?.url) imageUrl = media[0].url;

  const platforms = Array.isArray(raw.platforms)
    ? raw.platforms.join(",")
    : raw.platforms ?? "";

  const price = raw.webctas?.[0]?.price ?? {};
  const priceOriginalCents = priceToCents(price.basePriceValue ?? price.basePrice);
  let priceDiscountedCents = priceToCents(price.discountedValue ?? price.discountedPrice);
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

async function graphqlRequest(
  cfg: PsnConfig,
  operationName: string,
  variables: unknown
): Promise<any> {
  const params = new URLSearchParams({
    operationName,
    variables: JSON.stringify(variables),
    extensions: JSON.stringify({
      persistedQuery: { version: 1, sha256Hash: cfg.categoryGridHash },
    }),
  });
  const url = `${PSN_GRAPHQL_URL}?${params.toString()}`;

  let lastError: unknown = null;
  for (let attempt = 0; attempt < 4; attempt++) {
    try {
      const r = await fetch(url, {
        headers: {
          accept: "application/json",
          "user-agent": UA,
          "x-psn-store-locale-override": cfg.region,
        },
      });
      if (r.status >= 500) throw new Error(`PSN ${r.status}`);
      if (r.status === 403) throw new PsnApiError("PSN returned 403 (IP/Cloudflare block)");
      const data = (await r.json()) as any;
      if (data?.errors?.length) {
        const err = data.errors[0];
        const code = String(err?.extensions?.code || "").toUpperCase();
        if (code.includes("PERSISTED_QUERY_NOT_FOUND")) {
          throw new PersistedQueryNotFoundError();
        }
        throw new PsnApiError(`PSN GraphQL error: ${JSON.stringify(err)}`);
      }
      return data?.data ?? {};
    } catch (e) {
      if (e instanceof PersistedQueryNotFoundError || e instanceof PsnApiError) throw e;
      lastError = e;
      await new Promise((res) => setTimeout(res, 500 * 2 ** attempt));
    }
  }
  throw new PsnApiError(
    `PSN request failed after retries: ${(lastError as Error)?.message || lastError}`
  );
}

export async function* iterCategoryProducts(
  cfg: PsnConfig,
  pageSize = 100
): AsyncGenerator<RawProduct> {
  let offset = 0;
  let total: number | null = null;
  for (;;) {
    const data = await graphqlRequest(cfg, "categoryGridRetrieve", {
      id: cfg.dealsCategoryId,
      pageArgs: { size: pageSize, offset },
      sortBy: null,
      filterBy: [],
      facetOptions: [],
    });
    const grid = data?.categoryGridRetrieve ?? {};
    const products: RawProduct[] = grid?.products ?? [];
    if (total == null) total = Number(grid?.totalCount ?? 0);
    for (const p of products) if (p) yield p;
    offset += products.length;
    if (!products.length || (total != null && offset >= total)) break;
  }
}
