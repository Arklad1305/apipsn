import type {
  ApiError,
  CompetitorConfig,
  CompetitorRefreshResult,
  CompetitorStatus,
  Filters,
  GameOut,
  LookupItem,
  LookupResult,
  Platform,
  PlatformMeta,
  PlusPlanWithMatches,
  PricingSettings,
  ProductDetail,
  ProviderSource,
  PsnConfig,
  RefreshSummary,
  SettingsResponse,
  WatchedGame,
} from "./types";

const API = "/api";

async function req<T>(path: string, init?: RequestInit): Promise<T> {
  const r = await fetch(API + path, {
    ...init,
    headers: { "content-type": "application/json", ...(init?.headers || {}) },
  });
  if (!r.ok) {
    let data: ApiError | null = null;
    try {
      data = (await r.json()) as ApiError;
    } catch {
      /* ignore */
    }
    const err = new Error(data?.message || r.statusText) as Error & ApiError;
    err.error = data?.error || "request_failed";
    if (data?.hint) err.hint = data.hint;
    throw err;
  }
  return (await r.json()) as T;
}

export function fetchGames(f: Filters): Promise<GameOut[]> {
  const q = new URLSearchParams();
  if (f.search) q.set("search", f.search);
  if (f.minDiscount) q.set("min_discount", String(f.minDiscount));
  if (f.onlySelected) q.set("only_selected", "true");
  if (f.hidePublished) q.set("hide_published", "true");
  if (f.onlyWithMarket) q.set("only_with_market", "true");
  if (f.platform) q.set("platform", f.platform);
  q.set("sort", f.sort);
  return req<GameOut[]>(`/games?${q.toString()}`);
}

export function patchGame(
  dbKey: string,
  patch: Partial<Pick<GameOut, "selected" | "published" | "notes" | "youtubeUrl">>
): Promise<GameOut> {
  return req<GameOut>(`/games/${encodeURIComponent(dbKey)}`, {
    method: "PATCH",
    body: JSON.stringify(patch),
  });
}

export function refresh(platform?: Platform, region?: string): Promise<RefreshSummary> {
  const body: Record<string, string> = {};
  if (platform) body.platform = platform;
  if (region) body.region = region;
  return req<RefreshSummary>(`/refresh`, {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export function getSettings(): Promise<SettingsResponse> {
  return req<SettingsResponse>(`/settings`);
}

export function putSettings(
  patch: {
    pricing?: Partial<PricingSettings>;
    psn?: Partial<PsnConfig>;
    sources?: ProviderSource[];
  }
): Promise<SettingsResponse> {
  return req<SettingsResponse>(`/settings`, {
    method: "PUT",
    body: JSON.stringify(patch),
  });
}

export function getPlatforms(): Promise<PlatformMeta> {
  return req<PlatformMeta>(`/platforms`);
}

export function clearAll(): Promise<{ cleared: number }> {
  return req<{ cleared: number }>(`/mock/clear`, { method: "POST" });
}

export function getCompetitors(): Promise<{ competitors: CompetitorStatus[] }> {
  return req<{ competitors: CompetitorStatus[] }>(`/competitors`);
}

export function putCompetitors(
  competitors: CompetitorConfig[]
): Promise<{ competitors: CompetitorStatus[] }> {
  return req<{ competitors: CompetitorStatus[] }>(`/competitors`, {
    method: "PUT",
    body: JSON.stringify({ competitors }),
  });
}

export function refreshCompetitors(): Promise<CompetitorRefreshResult> {
  return req<CompetitorRefreshResult>(`/competitors/refresh`, { method: "POST" });
}

export async function getProductDetail(id: string): Promise<ProductDetail | null> {
  const r = await fetch(`${API}/games/${encodeURIComponent(id)}/detail`);
  if (r.status === 204) return null;
  if (!r.ok) throw new Error(r.statusText);
  return (await r.json()) as ProductDetail;
}

export function refreshProductDetail(id: string): Promise<ProductDetail> {
  return req<ProductDetail>(
    `/games/${encodeURIComponent(id)}/detail/refresh`,
    { method: "POST" }
  );
}

export function listWatchlist(): Promise<{ items: WatchedGame[] }> {
  return req<{ items: WatchedGame[] }>(`/watchlist`);
}

export function addToWatchlist(input: string, notes?: string): Promise<WatchedGame> {
  return req<WatchedGame>(`/watchlist`, {
    method: "POST",
    body: JSON.stringify({ input, notes }),
  });
}

export function patchWatched(
  id: string,
  patch: Partial<Pick<WatchedGame, "notes" | "name">>
): Promise<WatchedGame> {
  return req<WatchedGame>(`/watchlist/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: JSON.stringify(patch),
  });
}

export function removeFromWatchlist(id: string): Promise<{ removed: boolean }> {
  return req<{ removed: boolean }>(`/watchlist/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
}

export const exportCsvUrl = `${API}/games/export.csv?only_selected=true`;
export const exportJsonUrl = `${API}/games/export.json?only_selected=true`;
export const exportSupabaseUrl = `${API}/games/export-supabase.csv?only_selected=true`;

export function enrichGames(platform?: string, limit?: number): Promise<{
  enriched: number;
  total: number;
  results: Array<{ id: string; name: string; ok: boolean; error?: string }>;
}> {
  const body: Record<string, unknown> = {};
  if (platform) body.platform = platform;
  if (limit) body.limit = limit;
  return req(`/games/enrich`, { method: "POST", body: JSON.stringify(body) });
}

export function getPsPlus(): Promise<{ plans: PlusPlanWithMatches[]; scrapedAt: string | null }> {
  return req(`/ps-plus`);
}

export function refreshPsPlusPrices(): Promise<{
  prices: Record<string, Record<string, Record<string, number>>>;
  scrapedAt: string;
  errors: string[];
}> {
  return req(`/ps-plus/refresh`, { method: "POST" });
}

export function refreshExchangeRate(): Promise<{
  updated: Record<string, number>;
  fetchedAt: string;
  errors: string[];
}> {
  return req(`/exchange/refresh`, { method: "POST" });
}

export function lookupGames(items: LookupItem[]): Promise<{ results: LookupResult[] }> {
  return req(`/games/lookup`, {
    method: "POST",
    body: JSON.stringify({ items }),
  });
}

export function getDebugStatus(): Promise<{
  totalGames: number;
  activeGames: number;
  gamesByPlatform: Record<string, number>;
  sources: Array<{ platform: string; region: string; enabled: boolean }>;
  competitors: Array<{ key: string; label: string; productCount: number; refreshedAt: string | null }>;
  dbSizeKb: number | null;
}> {
  return req(`/debug/status`);
}
