/**
 * PSN product detail scraper.
 *
 * The product page (store.playstation.com/<region>/product/<id>) is SSR'd
 * by Next.js just like the category pages — the full product JSON sits
 * inside `<script id="__NEXT_DATA__">`. We walk that tree to find the
 * object matching our target id and normalize its fields.
 *
 * fileSize is the one thing PSN doesn't put in structured data on en-US;
 * we recover it from the visible HTML with a regex fallback.
 */
import { PsnApiError } from "./psn";

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 " +
  "(KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36";

export interface ProductMedia {
  heroUrl: string | null;
  logoUrl: string | null;
  backgroundUrl: string | null;
  coverUrl: string | null;
  screenshots: string[];
  videos: Array<{ url: string; posterUrl: string | null; mimeType: string | null }>;
}

export interface ProductDetail {
  id: string;
  name: string;
  description: string; // sanitized HTML
  shortDescription: string | null;
  publisher: string | null;
  developer: string | null;
  releaseDate: string | null;
  genres: string[];
  voiceLanguages: string[];
  subtitleLanguages: string[];
  ageRating: string | null;
  fileSize: string | null;
  platforms: string;
  media: ProductMedia;
  storeUrl: string;
  fetchedAt: string;
}

async function fetchHtml(url: string, region: string): Promise<string> {
  let lastErr: unknown = null;
  for (let attempt = 0; attempt < 3; attempt++) {
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
      if (r.status === 404) throw new PsnApiError(`Product not found (404): ${url}`);
      if (r.status === 403)
        throw new PsnApiError("PSN returned 403 (IP/Cloudflare block)");
      if (r.status >= 500) throw new Error(`PSN ${r.status}`);
      return await r.text();
    } catch (e) {
      if (e instanceof PsnApiError) throw e;
      lastErr = e;
      await new Promise((res) => setTimeout(res, 400 * 2 ** attempt));
    }
  }
  throw new PsnApiError(
    `PSN product fetch failed: ${(lastErr as Error)?.message || lastErr}`
  );
}

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

/** Walk the tree collecting every object whose `id` matches targetId.
 *  The page embeds the same product several times (header, hero, related
 *  links); we pick the richest record by total key count. */
function findProductRecords(tree: unknown, targetId: string): Record<string, unknown>[] {
  const out: Record<string, unknown>[] = [];
  const stack: unknown[] = [tree];
  while (stack.length) {
    const n = stack.pop();
    if (!n) continue;
    if (Array.isArray(n)) {
      for (const v of n) stack.push(v);
      continue;
    }
    if (typeof n !== "object") continue;
    const obj = n as Record<string, unknown>;
    if (obj.id === targetId || obj.productId === targetId) out.push(obj);
    for (const v of Object.values(obj)) {
      if (v && typeof v === "object") stack.push(v);
    }
  }
  return out;
}

function pickRichest(records: Record<string, unknown>[]): Record<string, unknown> | null {
  if (!records.length) return null;
  let best = records[0];
  let bestKeys = Object.keys(best).length;
  for (const r of records) {
    const k = Object.keys(r).length;
    if (k > bestKeys) {
      best = r;
      bestKeys = k;
    }
  }
  return best;
}

/** Merge fields across every record with this id — one slot might have
 *  media, another longDescription, etc. Richest wins on conflicts. */
function mergeRecords(records: Record<string, unknown>[]): Record<string, unknown> {
  const sorted = [...records].sort(
    (a, b) => Object.keys(a).length - Object.keys(b).length
  );
  const merged: Record<string, unknown> = {};
  for (const r of sorted) {
    for (const [k, v] of Object.entries(r)) {
      if (v == null) continue;
      if (merged[k] == null) merged[k] = v;
    }
  }
  return merged;
}

interface RawMedia {
  role?: string;
  type?: string;
  url?: string;
  source?: { url?: string; type?: string };
}

function extractMedia(obj: Record<string, unknown>): ProductMedia {
  const list = (obj.media as RawMedia[]) || [];
  const byRole: Record<string, string> = {};
  const screenshots: string[] = [];
  const videos: ProductMedia["videos"] = [];
  let posterForNextVideo: string | null = null;

  for (const m of list) {
    const role = String(m?.role || "").toUpperCase();
    const type = String(m?.type || "").toUpperCase();
    const url = m?.url || m?.source?.url || null;

    // Videos: type is usually VIDEO or VIDEO_PROMO, role is PROMO.
    if (type.includes("VIDEO") || role === "PROMO") {
      if (!url) continue;
      videos.push({
        url,
        posterUrl: posterForNextVideo,
        mimeType: m?.source?.type || null,
      });
      posterForNextVideo = null;
      continue;
    }
    if (!url) continue;

    // Stash the first role hit so we don't overwrite hero with a later
    // MASTER that might be lower quality.
    if (!byRole[role]) byRole[role] = url;

    if (role === "SCREENSHOT") screenshots.push(url);
  }

  return {
    heroUrl:
      byRole["HERO_BANNER"] ||
      byRole["HEROBANNER"] ||
      byRole["BACKGROUND_IMAGE"] ||
      byRole["BACKGROUND"] ||
      null,
    logoUrl: byRole["LOGO"] || byRole["LOGO_TRANSPARENT"] || null,
    backgroundUrl: byRole["BACKGROUND_IMAGE"] || byRole["BACKGROUND"] || null,
    coverUrl:
      byRole["MASTER"] ||
      byRole["BOXART"] ||
      byRole["GAMEHUB_COVER_ART"] ||
      byRole["PREVIEW_GAME_ART"] ||
      null,
    screenshots: [...new Set(screenshots)],
    videos,
  };
}

/** Minimal HTML sanitization — strips scripts/styles/event handlers and
 *  any tag outside the whitelist. Enough for PSN-sourced descriptions. */
const ALLOWED_TAGS = new Set([
  "p", "br", "strong", "b", "em", "i", "u", "ul", "ol", "li", "h2", "h3", "h4",
]);

export function sanitizeHtml(raw: string): string {
  if (!raw) return "";
  let s = raw;
  // Drop entire script/style blocks.
  s = s.replace(/<script[\s\S]*?<\/script>/gi, "");
  s = s.replace(/<style[\s\S]*?<\/style>/gi, "");
  // Strip any tag not in the whitelist. Preserve inner text.
  s = s.replace(/<\/?([a-zA-Z][a-zA-Z0-9]*)\b[^>]*>/g, (match, tag) => {
    const t = String(tag).toLowerCase();
    if (!ALLOWED_TAGS.has(t)) return "";
    // For allowed tags, drop all attributes (no href/style/on* possible).
    return match.startsWith("</") ? `</${t}>` : `<${t}>`;
  });
  // Collapse runs of empty paragraphs.
  s = s.replace(/(?:<p>\s*<\/p>\s*){2,}/gi, "<p></p>");
  return s.trim();
}

function toStringArray(v: unknown): string[] {
  if (!v) return [];
  if (Array.isArray(v)) {
    return v
      .map((x) => {
        if (typeof x === "string") return x;
        if (x && typeof x === "object") {
          const obj = x as Record<string, unknown>;
          return String(obj.name || obj.label || obj.description || "");
        }
        return "";
      })
      .filter(Boolean);
  }
  if (typeof v === "string") return v.split(",").map((s) => s.trim()).filter(Boolean);
  return [];
}

function str(v: unknown): string | null {
  if (v == null) return null;
  if (typeof v === "string") return v.trim() || null;
  if (typeof v === "object") {
    const obj = v as Record<string, unknown>;
    return (
      (typeof obj.name === "string" && obj.name) ||
      (typeof obj.description === "string" && obj.description) ||
      null
    );
  }
  return String(v) || null;
}

/** PSN rarely exposes file size in structured data on en-US. Scrape it
 *  from the visible HTML as a last resort. Matches "79.8 GB", "2 GB", etc. */
function extractFileSizeFromHtml(html: string): string | null {
  // The "File Size" label is followed by the value in the "About this game"
  // section. Look for variations.
  const labelMatch =
    /File\s*Size[^<]*<\/[^>]+>\s*<[^>]+>([^<]+)</i.exec(html) ||
    /"fileSize"\s*:\s*"([^"]+)"/i.exec(html);
  if (labelMatch && labelMatch[1]) return labelMatch[1].trim();
  // Global fallback: any "<number> GB" near a size-ish label. Very coarse
  // — only use if the labeled scrape misses.
  const any = /(\d{1,3}(?:[.,]\d+)?)\s*GB\b/i.exec(html);
  return any ? `${any[1]} GB` : null;
}

export async function fetchProductDetail(
  id: string,
  storeUrl: string,
  region: string
): Promise<ProductDetail> {
  const url = storeUrl || `https://store.playstation.com/en-us/product/${id}`;
  const html = await fetchHtml(url, region);
  const data = extractNextData(html);
  if (!data) throw new PsnApiError("No __NEXT_DATA__ in PSN product page");

  const records = findProductRecords(data, id);
  const rich = pickRichest(records);
  if (!rich) throw new PsnApiError(`Product ${id} not found in page JSON`);
  const obj = mergeRecords(records);

  const platformsRaw = obj.platforms;
  const platforms = Array.isArray(platformsRaw)
    ? platformsRaw.join(",")
    : String(platformsRaw || "");

  const longDesc =
    (typeof obj.longDescription === "string" && obj.longDescription) ||
    (typeof obj.description === "string" && obj.description) ||
    "";
  const shortDesc =
    (typeof obj.shortDescription === "string" && obj.shortDescription) ||
    null;

  const fileSize =
    str(obj.requiredDiskSpaceDescription) ||
    str(obj.fileSize) ||
    extractFileSizeFromHtml(html);

  const contentRating = obj.contentRating as Record<string, unknown> | undefined;
  const ageRating =
    str(contentRating?.description) ||
    str(contentRating?.name) ||
    str(obj.ageLimit);

  return {
    id,
    name: String(obj.name || obj.title || ""),
    description: sanitizeHtml(longDesc),
    shortDescription: shortDesc,
    publisher: str(obj.publisherName) || str(obj.publisher) || str(obj.publishedBy),
    developer: str(obj.developerName) || str(obj.developer),
    releaseDate:
      str(obj.releaseDate) ||
      str(obj.localizedReleaseDate) ||
      str(obj.releaseDateRaw),
    genres: toStringArray(obj.genres),
    voiceLanguages: toStringArray(obj.spokenLanguages || obj.compatibleVoices),
    subtitleLanguages: toStringArray(
      obj.subtitleLanguages || obj.compatibleSubtitles
    ),
    ageRating,
    fileSize,
    platforms,
    media: extractMedia(obj),
    storeUrl: url,
    fetchedAt: new Date().toISOString(),
  };
}
