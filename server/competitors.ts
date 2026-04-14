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

export type CompetitorType = "shopify" | "woocommerce" | "html" | "auto";

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
  // CLP has no decimals. Dots and commas are almost always thousands
  // separators ("$6.990"). The only decimal-ish case we see is Shopify's
  // USD-style "7990.00" / "7990,00" — last separator followed by exactly
  // 2 digits. Detect that, drop the decimal tail, strip the rest.
  let cleaned = s;
  const decimalTail = /[.,](\d{2})$/.exec(s);
  if (decimalTail) cleaned = s.slice(0, -3);
  cleaned = cleaned.replace(/[.,]/g, "");
  const n = Number(cleaned);
  if (!Number.isFinite(n)) return null;
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

const WOO_ENDPOINTS = [
  "/wp-json/wc/store/v1/products",
  "/wp-json/wc/store/products",
  "/?rest_route=/wc/store/v1/products",
];

async function fetchWoo(
  storeKey: string,
  domain: string
): Promise<CompetitorProduct[]> {
  let lastError = "no-attempt";
  for (const basePath of WOO_ENDPOINTS) {
    try {
      return await fetchWooAt(storeKey, domain, basePath);
    } catch (e) {
      if (e instanceof CompetitorFetchError) {
        lastError = e.message;
        continue;
      }
      throw e;
    }
  }
  throw new CompetitorFetchError(
    storeKey,
    `${domain} no expone ningún endpoint WooCommerce conocido (${lastError})`
  );
}

async function fetchWooAt(
  storeKey: string,
  domain: string,
  basePath: string
): Promise<CompetitorProduct[]> {
  const products: CompetitorProduct[] = [];
  const joiner = basePath.includes("?") ? "&" : "?";
  for (let page = 1; page <= 40; page++) {
    const url = `https://${domain}${basePath}${joiner}per_page=100&page=${page}`;
    const r = await fetch(url, {
      headers: { "user-agent": UA, accept: "application/json" },
    });
    if (r.status === 404) {
      throw new CompetitorFetchError(storeKey, `${basePath} → 404`);
    }
    if (!r.ok) {
      throw new CompetitorFetchError(storeKey, `${basePath} → HTTP ${r.status}`);
    }
    let batch: WooProduct[];
    try {
      batch = (await r.json()) as WooProduct[];
    } catch {
      throw new CompetitorFetchError(storeKey, `${basePath} devolvió no-JSON`);
    }
    if (!Array.isArray(batch) || !batch.length) break;
    for (const p of batch) {
      const raw =
        p.prices?.sale_price || p.prices?.price || p.prices?.regular_price;
      let price = parseClp(raw);
      if (price != null && raw && /^\d+$/.test(String(raw)) && price > 1_000_000) {
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
  if (!products.length) {
    throw new CompetitorFetchError(storeKey, `${basePath} vacío`);
  }
  return products;
}

// -------------------- HTML / sitemap + JSON-LD scraper --------------------

const SITEMAP_CANDIDATES = [
  "/product-sitemap.xml",
  "/wp-sitemap-posts-product-1.xml",
  "/sitemap-products.xml",
  "/sitemap_products_1.xml", // Shopify-style, but also used by others
  "/sitemap_index.xml",
  "/sitemap.xml",
];

const PRODUCT_URL_HINTS =
  /\/(producto|productos|product|products|tienda|shop|game|juego|item)\//i;

async function fetchText(url: string): Promise<string | null> {
  try {
    const r = await fetch(url, {
      headers: {
        "user-agent": UA,
        accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      },
    });
    if (!r.ok) return null;
    return await r.text();
  } catch {
    return null;
  }
}

async function resolveSitemapUrls(domain: string): Promise<string[]> {
  const seen = new Set<string>();
  const queue: string[] = [];
  for (const path of SITEMAP_CANDIDATES) {
    queue.push(`https://${domain}${path}`);
  }

  const urls: string[] = [];
  while (queue.length && urls.length < 2000) {
    const current = queue.shift()!;
    if (seen.has(current)) continue;
    seen.add(current);
    const xml = await fetchText(current);
    if (!xml) continue;

    // Sitemap index → <sitemap><loc>...</loc></sitemap>
    const nested = Array.from(
      xml.matchAll(/<sitemap[^>]*>[\s\S]*?<loc>([\s\S]*?)<\/loc>[\s\S]*?<\/sitemap>/gi)
    ).map((m) => m[1].trim());
    for (const n of nested) {
      if (/product|sitemap-\d+|page-sitemap/i.test(n) || nested.length < 10) {
        queue.push(n);
      }
    }

    // URL set → <url><loc>...</loc></url>
    const items = Array.from(
      xml.matchAll(/<url[^>]*>[\s\S]*?<loc>([\s\S]*?)<\/loc>[\s\S]*?<\/url>/gi)
    ).map((m) => m[1].trim());
    for (const u of items) urls.push(u);
  }

  // Keep likely-product URLs first. Fall back to everything if no hint matches.
  const hinted = urls.filter((u) => PRODUCT_URL_HINTS.test(u));
  const pool = hinted.length >= 10 ? hinted : urls;

  // Deduplicate preserving order
  const out: string[] = [];
  const dedup = new Set<string>();
  for (const u of pool) {
    if (dedup.has(u)) continue;
    dedup.add(u);
    out.push(u);
  }
  return out;
}

interface JsonLdProduct {
  "@type"?: string | string[];
  name?: string;
  offers?:
    | {
        price?: string | number;
        lowPrice?: string | number;
        priceCurrency?: string;
        availability?: string;
      }
    | Array<{
        price?: string | number;
        priceCurrency?: string;
        availability?: string;
      }>;
}

function isProductNode(n: unknown): n is JsonLdProduct {
  if (!n || typeof n !== "object") return false;
  const t = (n as JsonLdProduct)["@type"];
  if (!t) return false;
  if (Array.isArray(t)) return t.some((x) => /product/i.test(x));
  return /product/i.test(String(t));
}

function extractProductFromHtml(
  html: string,
  storeKey: string,
  url: string
): CompetitorProduct | null {
  const scripts = Array.from(
    html.matchAll(
      /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi
    )
  );
  for (const m of scripts) {
    let parsed: unknown;
    try {
      parsed = JSON.parse(m[1].trim());
    } catch {
      continue;
    }
    const items: unknown[] = [];
    const graph = (parsed as { "@graph"?: unknown[] })?.["@graph"];
    if (Array.isArray(graph)) items.push(...graph);
    else if (Array.isArray(parsed)) items.push(...parsed);
    else items.push(parsed);

    for (const item of items) {
      if (!isProductNode(item)) continue;
      const p = item as JsonLdProduct;
      const name = p.name;
      let priceRaw: string | number | undefined;
      let availability = "";
      if (Array.isArray(p.offers)) {
        priceRaw = p.offers[0]?.price;
        availability = p.offers[0]?.availability ?? "";
      } else if (p.offers) {
        priceRaw = p.offers.price ?? p.offers.lowPrice;
        availability = p.offers.availability ?? "";
      }
      const price = parseClp(priceRaw);
      if (!name || price == null) continue;
      return {
        storeKey,
        title: String(name),
        url,
        priceClp: price,
        available: !/outofstock/i.test(availability),
      };
    }
  }

  // Fallback: OpenGraph / itemprop meta
  const ogTitle = /<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["']/i.exec(
    html
  )?.[1];
  const ogPrice =
    /<meta[^>]+property=["']product:price:amount["'][^>]+content=["']([^"']+)["']/i.exec(
      html
    )?.[1] ||
    /<meta[^>]+itemprop=["']price["'][^>]+content=["']([^"']+)["']/i.exec(html)?.[1];
  if (ogTitle && ogPrice) {
    const price = parseClp(ogPrice);
    if (price != null) {
      return { storeKey, title: ogTitle, url, priceClp: price, available: true };
    }
  }

  return null;
}

async function fetchHtmlStorefront(
  storeKey: string,
  domain: string
): Promise<CompetitorProduct[]> {
  const urls = await resolveSitemapUrls(domain);
  if (!urls.length) {
    throw new CompetitorFetchError(
      storeKey,
      `${domain} no expone sitemap.xml con URLs de productos`
    );
  }
  const limit = Math.min(urls.length, 400);
  const concurrency = 6;
  const out: CompetitorProduct[] = [];

  for (let i = 0; i < limit; i += concurrency) {
    const batch = urls.slice(i, i + concurrency);
    const results = await Promise.all(
      batch.map(async (u) => {
        const html = await fetchText(u);
        if (!html) return null;
        return extractProductFromHtml(html, storeKey, u);
      })
    );
    for (const p of results) if (p) out.push(p);
  }
  if (!out.length) {
    throw new CompetitorFetchError(
      storeKey,
      `${domain}: sitemap encontrado pero no se pudieron extraer productos (sin JSON-LD ni og:price)`
    );
  }
  return out;
}

// -------------------- public API --------------------

export async function fetchCompetitor(
  cfg: CompetitorConfig
): Promise<CompetitorProduct[]> {
  if (cfg.type === "shopify") return fetchShopify(cfg.key, cfg.domain);
  if (cfg.type === "woocommerce") return fetchWoo(cfg.key, cfg.domain);
  if (cfg.type === "html") return fetchHtmlStorefront(cfg.key, cfg.domain);

  // auto: shopify → woo → html (sitemap+json-ld) fallback chain
  const errors: string[] = [];
  for (const fn of [fetchShopify, fetchWoo, fetchHtmlStorefront]) {
    try {
      return await fn(cfg.key, cfg.domain);
    } catch (e) {
      if (!(e instanceof CompetitorFetchError)) throw e;
      errors.push(e.message);
    }
  }
  throw new CompetitorFetchError(
    cfg.key,
    `no se pudo scrapear ${cfg.domain}: ${errors.join(" · ")}`
  );
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
