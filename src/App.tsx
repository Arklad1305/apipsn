import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { animateSlideIn } from "./anim";
import {
  addToWatchlist,
  clearAll,
  exportCsvUrl,
  fetchGames,
  getSettings,
  refresh,
  refreshCompetitors,
} from "./api";
import type {
  Filters,
  GameOut,
  SettingsResponse,
  WatchlistAlert,
} from "./types";
import { Toolbar } from "./components/Toolbar";
import { Tabs } from "./components/Tabs";
import { FiltersBar } from "./components/FiltersBar";
import { GamesTable } from "./components/GamesTable";
import { Pagination } from "./components/Pagination";
import { ProductDetailPanel } from "./components/ProductDetailPanel";
import { SettingsPanel } from "./components/SettingsPanel";
import { WatchlistPanel } from "./components/WatchlistPanel";

const PAGE_SIZE = 30;

const DEFAULT_FILTERS: Filters = {
  search: "",
  minDiscount: 0,
  onlySelected: false,
  hidePublished: false,
  onlyWithMarket: false,
  sort: "discount",
};

type TabId = "offers" | "watchlist" | "settings";

const TABS: { id: TabId; label: string; hint?: string }[] = [
  { id: "offers", label: "Ofertas", hint: "Catálogo de ofertas semanales de PSN" },
  { id: "watchlist", label: "Seguimiento", hint: "Juegos que te avisamos cuando entren en oferta" },
  { id: "settings", label: "Configuración", hint: "Precios, PSN y competencia" },
];

export function App() {
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);
  const [games, setGames] = useState<GameOut[]>([]);
  const [loading, setLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState<string>("");
  const [statusKind, setStatusKind] = useState<"ok" | "err" | "info">("info");
  const [settings, setSettings] = useState<SettingsResponse | null>(null);
  const [tab, setTab] = useState<TabId>("offers");
  const [detailGame, setDetailGame] = useState<GameOut | null>(null);
  const [page, setPage] = useState(1);
  const [watchlistAlerts, setWatchlistAlerts] = useState<WatchlistAlert[]>([]);
  const statusRef = useRef<HTMLDivElement>(null);

  // Any filter change snaps us back to page 1.
  useEffect(() => {
    setPage(1);
  }, [filters]);

  const totalPages = Math.max(1, Math.ceil(games.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageStart = (safePage - 1) * PAGE_SIZE;
  const pageGames = games.slice(pageStart, pageStart + PAGE_SIZE);

  useLayoutEffect(() => {
    if (statusMsg && statusRef.current) animateSlideIn(statusRef.current);
  }, [statusMsg, statusKind]);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const list = await fetchGames(filters);
      setGames(list);
    } catch (e) {
      setStatusKind("err");
      setStatusMsg((e as Error).message || "Error cargando juegos");
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    reload();
  }, [reload]);

  useEffect(() => {
    getSettings().then(setSettings).catch(() => {});
  }, []);

  const onRefresh = async () => {
    setStatusKind("info");
    setStatusMsg("Consultando PSN…");
    try {
      const summary = await refresh();
      setStatusKind("ok");
      const base = `${summary.totalSeen} vistos → ${summary.kept} juegos`;
      const filtered = summary.filteredAddOns
        ? ` (${summary.filteredAddOns} complementos filtrados)`
        : "";
      setStatusMsg(
        `OK: ${base}${filtered} · ${summary.new} nuevos, ${summary.updated} actualizados, ${summary.disappeared} fuera`
      );
      if (summary.watchlistAlerts?.length) {
        setWatchlistAlerts(summary.watchlistAlerts);
      }
      await reload();
    } catch (e) {
      const err = e as Error & { hint?: string };
      setStatusKind("err");
      setStatusMsg(`${err.message}${err.hint ? " — " + err.hint : ""}`);
    }
  };

  const onRefreshCompetitors = async () => {
    setStatusKind("info");
    setStatusMsg("Scrapeando competencia…");
    try {
      const r = await refreshCompetitors();
      const ok = r.results.filter((x) => !x.error);
      const fail = r.results.filter((x) => x.error);
      const okSummary = ok.map((x) => `${x.label}: ${x.count}`).join(", ");
      const failSummary = fail.map((x) => `${x.label} ✗ ${x.error}`).join(" · ");
      setStatusKind(fail.length ? "err" : "ok");
      setStatusMsg(
        `Competencia: ${okSummary}${failSummary ? " — " + failSummary : ""}`
      );
      await reload();
    } catch (e) {
      setStatusKind("err");
      setStatusMsg((e as Error).message);
    }
  };

  const onClear = async () => {
    if (!confirm("¿Desactivar todos los juegos?")) return;
    try {
      await clearAll();
      await reload();
    } catch (e) {
      setStatusKind("err");
      setStatusMsg((e as Error).message);
    }
  };

  const onSavedSettings = (s: SettingsResponse) => {
    setSettings(s);
    setStatusKind("ok");
    setStatusMsg("Configuración guardada");
    reload();
  };

  const updateGameLocal = (g: GameOut) => {
    setGames((prev) => prev.map((x) => (x.id === g.id ? g : x)));
    setDetailGame((prev) => (prev && prev.id === g.id ? g : prev));
  };

  const onFollowGame = async (g: GameOut) => {
    try {
      await addToWatchlist(g.id);
      setStatusKind("ok");
      setStatusMsg(`Sigues a “${g.name}”. Te avisaré cuando entre en oferta.`);
    } catch (e) {
      setStatusKind("err");
      setStatusMsg((e as Error).message);
    }
  };

  const activeTab: TabId = detailGame ? "offers" : tab;

  return (
    <div className="app">
      <header className="app-header">
        <div className="brand">
          <h1>apipsn</h1>
          <p className="subtitle">
            Ofertas PS Store US · precios de reventa en CLP
          </p>
        </div>
        <Tabs tabs={TABS} active={activeTab} onChange={(id) => {
          setTab(id);
          setDetailGame(null);
        }} />
        <Toolbar
          onRefresh={onRefresh}
          onRefreshCompetitors={onRefreshCompetitors}
          onClear={onClear}
          exportHref={exportCsvUrl}
          variant={
            detailGame
              ? "offers"
              : tab === "watchlist"
              ? "watchlist"
              : tab === "settings"
              ? "settings"
              : "offers"
          }
        />
      </header>

      {statusMsg && (
        <div ref={statusRef} className={`status ${statusKind}`}>
          {statusMsg}
          <button className="link" onClick={() => setStatusMsg("")}>
            ✕
          </button>
        </div>
      )}

      {watchlistAlerts.length > 0 && (
        <div className="status ok watchlist-banner">
          <span>
            <strong>
              {watchlistAlerts.length} juego
              {watchlistAlerts.length === 1 ? "" : "s"} de tu seguimiento
              {watchlistAlerts.length === 1 ? " entró" : " entraron"} en oferta:
            </strong>{" "}
            {watchlistAlerts
              .slice(0, 3)
              .map((a) => `${a.name} (-${a.discountPercent}%)`)
              .join(" · ")}
            {watchlistAlerts.length > 3 && ` · +${watchlistAlerts.length - 3}`}
          </span>
          <button
            className="link"
            onClick={() => {
              setTab("watchlist");
              setDetailGame(null);
            }}
          >
            Ver
          </button>
          <button className="link" onClick={() => setWatchlistAlerts([])}>
            ✕
          </button>
        </div>
      )}

      {detailGame ? (
        <ProductDetailPanel
          game={detailGame}
          onClose={() => setDetailGame(null)}
          onGameUpdated={updateGameLocal}
        />
      ) : tab === "watchlist" ? (
        <WatchlistPanel />
      ) : tab === "settings" && settings ? (
        <SettingsPanel initial={settings} onSaved={onSavedSettings} />
      ) : tab === "settings" ? (
        <div className="loading">Cargando configuración…</div>
      ) : (
        <>
          <FiltersBar
            filters={filters}
            setFilters={setFilters}
            count={games.length}
          />

          {loading ? (
            <div className="loading">Cargando…</div>
          ) : games.length === 0 ? (
            <div className="empty">
              No hay juegos todavía. Apretá <strong>Actualizar ofertas</strong>{" "}
              para consultar PSN.
            </div>
          ) : (
            <>
              <GamesTable
                games={pageGames}
                onGameUpdated={updateGameLocal}
                onOpenDetail={setDetailGame}
                onFollowGame={onFollowGame}
              />
              <Pagination
                page={safePage}
                totalPages={totalPages}
                pageSize={PAGE_SIZE}
                total={games.length}
                onChange={setPage}
              />
            </>
          )}
        </>
      )}
    </div>
  );
}
