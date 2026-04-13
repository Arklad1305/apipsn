/**
 * Competitor scrapers + fuzzy matcher.
 *
 * We support two generic storefront types:
 *   - Shopify:     GET https://<domain>/products.json?limit=250&page=N
 *   - WooCommerce: GET https://<domain>/wp-json/wc/store/v1/products?per_page=100&page=N
 *
 * Both expose public, unauthenticated JSON feeds. A third type "auto" tries
 * Shopify first and falls back to WooCommerce so the user doesn't have to
 * guess when adding a new store.
 *
 * The matcher normalizes titles (lowercased, accent-stripped, noise words
 * removed) and compares PSN ↔ competitor entries with Jaccard similarity.
 */
import type { Game } from "./store";

const UA =
  "Mozilla/5.0 (compatible; apipsn/1.0; market-research)";

export type CompetitorType = "shopify" | "woocommerce" | "auto";

export interface CompetitorConfig {
  key: string;
  label: string;
  domain: string;
  type: CompetitorType;
  enabled: boolean;
}

export interface CompetitorProduct {
  storeKey: string;
  title: string;
  url: string;
  priceClp: number;
  available: boolean;
}

export interface CompetitorMatch {
  storeKey: string;
  title: string;
  url: string;
  priceClp: number;
  available: boolean;
  score: number;
}

export class CompetitorFetchError extends Error {
  constructor(public storeKey: string, message: string) {
    super(message);
  }
}

// -------------------- normalization + similarity --------------------

const NOISE = new Set([
  "for","the","of","and","or","a","an","de","del","la","el","los","las",
  "ps4","ps5","ps3","psv","psp","xbox","pc","steam","nintendo","switch",
  "edition","ed","deluxe","gold","silver","bronze","platinum","ultimate",
  "goty","standard","digital","cuenta","primaria","secundaria","primaria1",
  "primaria2","game","juego","juegos","bundle","pack","season","pass",
  "collection","complete","remastered","remake","hd","definitive",
  "anniversary","version","vers","ver","inc","incluye","pack",
]);

export function tokenize(title: string): string[] {
  return title
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[™®©]/g, "")
    .replace(/\[[^\]]*\]/g, " ")
    .replace(/\([^)]*\)/g, " ")
    .replace(/[^a-z0-9 ]+/g, " ")
    .split(/\s+/)
    .filter((t) => t && !NOISE.has(t));
}

export function similarity(a: string[], b: string[]): number {
  if (!a.length || !b.length) return 0;
  const sa = new Set(a);
  const sb = new Set(b);
  let inter = 0;
  for (const x of sa) if (sb.has(x)) inter++;
  if (!inter) return 0;
  const union = sa.size + sb.size - inter;
  const jaccard = inter / union;
  // Containment bonus: if the smaller set is fully contained in the larger,
  // reward that (covers "Red Dead Redemption 2" ⊂ "Red Dead Redemption 2 PS4").
  const minSize = Math.min(sa.size, sb.size);
  const containment = inter / minSize;
  return 0.6 * jaccard + 0.4 * containment;
}

/** Match threshold below which we ignore a candidate pair. */
export const MATCH_THRESHOLD = 0.55;

// -------------------- price parsing --------------------

function parseClp(v: unknown): number | null {
  if (v == null) return null;
  if (typeof v === "number" && Number.isFinite(v)) {
    // Shopify often gives strings like "29990.00"; numbers are in major units.
    // Heuristic: values < 1000 are unlikely for CLP; treat as-is otherwise.
    return Math.round(v);
  }
  const s = String(v).replace(/[^\d,.-]/g, "");
  if (!s) return null;
  // Chilean format often uses "." as thousands separator, "," as decimal.
  // Shopify exports decimals with ".", Woo with either. We strip all but the
  // last separator and treat that as the decimal point.
  const cleaned = s.replace(/[.,]/g, (_, i, str) =>
    i === str.lastIndexOf(".") || i === str.lastIndexOf(",") ? "." : ""
  );
  const n = Number(cleaned);
  if (!Number.isFinite(n)) return null;
  // If the resulting value has a fractional part smaller than 1, we assume
  // the ".xx" was CLP cents noise (not valid for Chilean peso) and round.
  return Math.round(n);
}

// -------------------- Shopify scraper --------------------

interface ShopifyVariant {
  price?: string;
  available?: boolean;
  compare_at_price?: string;
}

interface ShopifyProduct {
  id: number;
  title: string;
  handle: string;
  variants?: ShopifyVariant[];
}

async function fetchShopify(
  storeKey: string,
  domain: string
): Promise<CompetitorProduct[]> {
  const products: CompetitorProduct[] = [];
  for (let page = 1; page <= 40; page++) {
    const url = `https://${domain}/products.json?limit=250&page=${page}`;
    const r = await fetch(url, {
      headers: { "user-agent": UA, accept: "application/json" },
    });
    if (r.status === 404) {
      throw new CompetitorFetchError(
        storeKey,
        `${domain} no expone /products.json (¿no es Shopify?)`
      );
    }
    if (!r.ok) {
      throw new CompetitorFetchError(
        storeKey,
        `${domain} HTTP ${r.status} en /products.json`
      );
    }
    let body: { products?: ShopifyProduct[] };
    try {
      body = (await r.json()) as { products?: ShopifyProduct[] };
    } catch {
      throw new CompetitorFetchError(
        storeKey,
        `${domain} devolvió algo que no es JSON en /products.json`
      );
    }
    const batch = body.products ?? [];
    if (!batch.length) break;
    for (const p of batch) {
      const variant = p.variants?.[0];
      const price = parseClp(variant?.price);
      if (price == null) continue;
      products.push({
        storeKey,
        title: p.title,
        url: `https://${domain}/products/${p.handle}`,
        priceClp: price,
        available: variant?.available !== false,
      });
    }
    if (batch.length < 250) break;
  }
  return products;
}

// -------------------- WooCommerce scraper --------------------

interface WooPrices {
  price?: string;
  regular_price?: string;
  sale_price?: string;
}

interface WooProduct {
  id: number;
  name: string;
  permalink: string;
  prices?: WooPrices;
  is_in_stock?: boolean;
  is_purchasable?: boolean;
}

async function fetchWoo(
  storeKey: string,
  domain: string
): Promise<CompetitorProduct[]> {
  const products: CompetitorProduct[] = [];
  for (let page = 1; page <= 40; page++) {
    const url = `https://${domain}/wp-json/wc/store/v1/products?per_page=100&page=${page}`;
    const r = await fetch(url, {
      headers: { "user-agent": UA, accept: "application/json" },
    });
    if (r.status === 404) {
      throw new CompetitorFetchError(
        storeKey,
        `${domain} no expone /wp-json/wc/store/v1/products (¿no es WooCommerce?)`
      );
    }
    if (!r.ok) {
      throw new CompetitorFetchError(
        storeKey,
        `${domain} HTTP ${r.status} en WooCommerce`
      );
    }
    let batch: WooProduct[];
    try {
      batch = (await r.json()) as WooProduct[];
    } catch {
      throw new CompetitorFetchError(storeKey, `${domain} JSON inválido (Woo)`);
    }
    if (!Array.isArray(batch) || !batch.length) break;
    for (const p of batch) {
      // Woo v1 returns prices in minor units as strings ("999900" for 9999.00).
      const raw =
        p.prices?.sale_price || p.prices?.price || p.prices?.regular_price;
      let price = parseClp(raw);
      if (price != null && raw && /^\d+$/.test(String(raw)) && price > 1_000_000) {
        // If it's plain digits and looks like minor units, divide by 100.
        price = Math.round(price / 100);
      }
      if (price == null) continue;
      products.push({
        storeKey,
        title: p.name,
        url: p.permalink,
        priceClp: price,
        available: p.is_in_stock !== false,
      });
    }
    if (batch.length < 100) break;
  }
  return products;
}

// -------------------- public API --------------------

export async function fetchCompetitor(
  cfg: CompetitorConfig
): Promise<CompetitorProduct[]> {
  if (cfg.type === "shopify") return fetchShopify(cfg.key, cfg.domain);
  if (cfg.type === "woocommerce") return fetchWoo(cfg.key, cfg.domain);
  // auto: try shopify, then woo
  try {
    return await fetchShopify(cfg.key, cfg.domain);
  } catch (e) {
    if (!(e instanceof CompetitorFetchError)) throw e;
    return await fetchWoo(cfg.key, cfg.domain);
  }
}

/**
 * Build {gameId -> matches[]} for a list of PSN games and the combined pool
 * of competitor products (from all enabled stores).
 */
export function matchGames(
  games: Game[],
  products: CompetitorProduct[]
): Record<string, CompetitorMatch[]> {
  // Precompute tokens once per product.
  const productTokens: Array<{ p: CompetitorProduct; tokens: string[] }> =
    products.map((p) => ({ p, tokens: tokenize(p.title) }));

  const out: Record<string, CompetitorMatch[]> = {};
  for (const g of games) {
    const gTokens = tokenize(g.name);
    if (!gTokens.length) continue;
    const matches: CompetitorMatch[] = [];
    for (const { p, tokens } of productTokens) {
      if (!tokens.length) continue;
      const score = similarity(gTokens, tokens);
      if (score >= MATCH_THRESHOLD) {
        matches.push({
          storeKey: p.storeKey,
          title: p.title,
          url: p.url,
          priceClp: p.priceClp,
          available: p.available,
          score,
        });
      }
    }
    // Keep at most top-5 per game to limit payload size.
    matches.sort((a, b) => a.priceClp - b.priceClp);
    out[g.id] = matches.slice(0, 5);
  }
  return out;
}
