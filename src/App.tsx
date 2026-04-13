import { useCallback, useEffect, useState } from "react";
import {
  clearAll,
  exportCsvUrl,
  fetchGames,
  getSettings,
  refresh,
  seedDemo,
} from "./api";
import type {
  Filters,
  GameOut,
  PricingSettings,
  PsnConfig,
  SettingsResponse,
} from "./types";
import { Toolbar } from "./components/Toolbar";
import { FiltersBar } from "./components/FiltersBar";
import { GamesTable } from "./components/GamesTable";
import { SettingsPanel } from "./components/SettingsPanel";

const DEFAULT_FILTERS: Filters = {
  search: "",
  minDiscount: 0,
  onlySelected: false,
  hidePublished: false,
  sort: "discount",
};

export function App() {
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);
  const [games, setGames] = useState<GameOut[]>([]);
  const [loading, setLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState<string>("");
  const [statusKind, setStatusKind] = useState<"ok" | "err" | "info">("info");
  const [settings, setSettings] = useState<SettingsResponse | null>(null);
  const [showSettings, setShowSettings] = useState(false);

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
      setStatusMsg(
        `OK: ${summary.totalSeen} vistos (${summary.new} nuevos, ${summary.updated} actualizados, ${summary.disappeared} fuera)`
      );
      await reload();
    } catch (e) {
      const err = e as Error & { hint?: string };
      setStatusKind("err");
      setStatusMsg(`${err.message}${err.hint ? " — " + err.hint : ""}`);
    }
  };

  const onSeed = async () => {
    setStatusKind("info");
    setStatusMsg("Cargando datos demo…");
    try {
      const r = await seedDemo();
      setStatusKind("ok");
      setStatusMsg(`Demo cargado: ${r.seeded} juegos`);
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
    setStatusMsg("Ajustes guardados");
    reload();
  };

  const updateGameLocal = (g: GameOut) =>
    setGames((prev) => prev.map((x) => (x.id === g.id ? g : x)));

  return (
    <div className="app">
      <header>
        <div>
          <h1>apipsn</h1>
          <p className="subtitle">
            Ofertas PS Store US · precios de reventa en CLP (primaria 1 ·
            primaria 2 · secundaria)
          </p>
        </div>
        <Toolbar
          onRefresh={onRefresh}
          onSeed={onSeed}
          onClear={onClear}
          onToggleSettings={() => setShowSettings((s) => !s)}
          exportHref={exportCsvUrl}
        />
      </header>

      {statusMsg && (
        <div className={`status ${statusKind}`}>
          {statusMsg}
          <button className="link" onClick={() => setStatusMsg("")}>
            ✕
          </button>
        </div>
      )}

      {showSettings && settings && (
        <SettingsPanel
          initial={settings}
          onSaved={onSavedSettings}
          onClose={() => setShowSettings(false)}
        />
      )}

      <FiltersBar filters={filters} setFilters={setFilters} count={games.length} />

      {loading ? (
        <div className="loading">Cargando…</div>
      ) : games.length === 0 ? (
        <div className="empty">
          No hay juegos todavía. Usá <strong>Actualizar ofertas</strong> para
          consultar PSN, o <strong>Seed demo</strong> para poblar con datos de
          ejemplo (recomendado si estás en Bolt).
        </div>
      ) : (
        <GamesTable games={games} onGameUpdated={updateGameLocal} />
      )}
    </div>
  );
}
