import type {
  ApiError,
  CompetitorConfig,
  CompetitorRefreshResult,
  CompetitorStatus,
  Filters,
  GameOut,
  PricingSettings,
  ProductDetail,
  PsnConfig,
  RefreshSummary,
  SettingsResponse,
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
  q.set("sort", f.sort);
  return req<GameOut[]>(`/games?${q.toString()}`);
}

export function patchGame(
  id: string,
  patch: Partial<Pick<GameOut, "selected" | "published" | "notes" | "youtubeUrl">>
): Promise<GameOut> {
  return req<GameOut>(`/games/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: JSON.stringify(patch),
  });
}

export function refresh(): Promise<RefreshSummary> {
  return req<RefreshSummary>(`/refresh`, { method: "POST" });
}

export function getSettings(): Promise<SettingsResponse> {
  return req<SettingsResponse>(`/settings`);
}

export function putSettings(
  patch: { pricing?: Partial<PricingSettings>; psn?: Partial<PsnConfig> }
): Promise<SettingsResponse> {
  return req<SettingsResponse>(`/settings`, {
    method: "PUT",
    body: JSON.stringify(patch),
  });
}

export function seedDemo(): Promise<{ seeded: number }> {
  return req<{ seeded: number }>(`/mock/seed`, { method: "POST" });
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

/** Returns null when the detail has not been cached yet. */
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

export const exportCsvUrl = `${API}/games/export.csv?only_selected=true`;
