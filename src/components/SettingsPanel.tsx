import { useEffect, useMemo, useRef, useState } from "react";
import { getCompetitors, putCompetitors, putSettings, refreshExchangeRate } from "../api";
import type {
  CompetitorStatus,
  CompetitorType,
  PricingSettings,
  ProviderSource,
  PsnConfig,
  SettingsResponse,
} from "../types";
import { PLATFORM_LABELS } from "../types";

const SOURCE_DEFAULT_URLS: Record<string, string> = {
  "psn:us": "https://store.playstation.com/en-us/category/deals",
  "psn:br": "https://store.playstation.com/pt-br/category/3f772501-f6f8-49b7-abac-874a88ca4897/1",
  "xbox:us": "https://www.xbox.com/en-US/games/browse/DynamicChannel.GameDeals",
  "xbox:br": "https://www.xbox.com/pt-BR/games/browse/DynamicChannel.GameDeals",
  "xbox:tr": "https://www.xbox.com/tr-TR/games/browse/DynamicChannel.GameDeals",
  "nintendo:us": "https://www.nintendo.com/us/store/sales-and-deals/",
  "nintendo:jp": "https://store-jp.nintendo.com/list/software?isSale=true",
  "steam:us": "https://store.steampowered.com/search/?specials=1",
  "steam:br": "https://store.steampowered.com/search/?specials=1&cc=br",
  "steam:tr": "https://store.steampowered.com/search/?specials=1&cc=tr",
};

interface Props {
  initial: SettingsResponse;
  onSaved: (s: SettingsResponse) => void;
}

type SectionId = "pricing" | "sources" | "psn" | "competitors";

const SECTIONS: { id: SectionId; label: string; hint: string }[] = [
  { id: "pricing", label: "Precios", hint: "Tipo de cambio y multiplicadores" },
  { id: "sources", label: "Plataformas", hint: "PSN, Xbox, Nintendo, Steam" },
  { id: "psn", label: "PSN", hint: "Región y categoría de ofertas" },
  { id: "competitors", label: "Competencia", hint: "Tiendas a scrapear" },
];

export function SettingsPanel({ initial, onSaved }: Props) {
  const [pricing, setPricing] = useState<PricingSettings>(initial.pricing);
  const [psn, setPsn] = useState<PsnConfig>(initial.psn);
  const [sources, setSources] = useState<ProviderSource[]>(initial.sources || []);
  const [competitors, setCompetitors] = useState<CompetitorStatus[]>([]);
  const [saving, setSaving] = useState(false);
  const [tcUpdating, setTcUpdating] = useState(false);
  const [tcMsg, setTcMsg] = useState<string>("");
  const [active, setActive] = useState<SectionId>("pricing");

  const refs = {
    pricing: useRef<HTMLDivElement>(null),
    sources: useRef<HTMLDivElement>(null),
    psn: useRef<HTMLDivElement>(null),
    competitors: useRef<HTMLDivElement>(null),
  };

  useEffect(() => {
    getCompetitors()
      .then((r) => setCompetitors(r.competitors))
      .catch(() => {});
  }, []);

  const dirty = useMemo(() => {
    return (
      JSON.stringify(pricing) !== JSON.stringify(initial.pricing) ||
      JSON.stringify(psn) !== JSON.stringify(initial.psn) ||
      JSON.stringify(sources) !== JSON.stringify(initial.sources || []) ||
      competitors.length > 0
    );
  }, [pricing, psn, sources, initial, competitors]);

  const save = async () => {
    setSaving(true);
    try {
      const r = await putSettings({ pricing, psn, sources });
      await putCompetitors(
        competitors.map(({ key, label, domain, type, enabled }) => ({
          key,
          label,
          domain,
          type,
          enabled,
        }))
      );
      onSaved(r);
    } finally {
      setSaving(false);
    }
  };

  const updateTc = async () => {
    setTcUpdating(true);
    setTcMsg("");
    try {
      const r = await refreshExchangeRate();
      if (r.updated.usdToClp) {
        setPricing((p) => ({ ...p, usdToClp: r.updated.usdToClp }));
        setTcMsg(`USD actualizado: ${r.updated.usdToClp} CLP (${r.fetchedAt.slice(0, 10)})`);
      } else {
        setTcMsg(r.errors.join(" · ") || "No se pudo obtener el tipo de cambio");
      }
    } catch (e) {
      setTcMsg((e as Error).message);
    } finally {
      setTcUpdating(false);
    }
  };

  const goto = (id: SectionId) => {
    setActive(id);
    refs[id].current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const toggleSource = (idx: number, enabled: boolean) =>
    setSources((list) =>
      list.map((s, i) => (i === idx ? { ...s, enabled } : s))
    );

  const updateSourceField = (idx: number, field: string, value: string) =>
    setSources((list) =>
      list.map((s, i) => (i === idx ? { ...s, [field]: value } : s))
    );

  const updateCompetitor = (idx: number, patch: Partial<CompetitorStatus>) =>
    setCompetitors((list) =>
      list.map((c, i) => (i === idx ? { ...c, ...patch } : c))
    );

  const addCompetitor = () =>
    setCompetitors((list) => [
      ...list,
      {
        key: `store${list.length + 1}`,
        label: "Nueva tienda",
        domain: "",
        type: "auto" as CompetitorType,
        enabled: true,
        refreshedAt: null,
        productCount: 0,
      },
    ]);

  const removeCompetitor = (idx: number) =>
    setCompetitors((list) => list.filter((_, i) => i !== idx));

  const numField = <K extends keyof PricingSettings>(
    k: K,
    label: string,
    hint: string,
    step = 0.01
  ) => (
    <label key={k} className="field">
      <span className="field-label">{label}</span>
      <input
        type="number"
        step={step}
        value={pricing[k] as number}
        onChange={(e) =>
          setPricing((p) => ({ ...p, [k]: Number(e.target.value) }))
        }
      />
      <span className="field-hint">{hint}</span>
    </label>
  );

  return (
    <section className="settings settings-v2">
      <aside className="settings-nav">
        {SECTIONS.map((s) => (
          <button
            key={s.id}
            type="button"
            className={active === s.id ? "settings-nav-item active" : "settings-nav-item"}
            onClick={() => goto(s.id)}
          >
            <span className="settings-nav-label">{s.label}</span>
            <span className="settings-nav-hint">{s.hint}</span>
          </button>
        ))}
      </aside>

      <div className="settings-body">
        <section ref={refs.pricing} className="settings-section" id="pricing">
          <header className="settings-section-header">
            <h3>Precios</h3>
            <p className="help">
              Fórmula: <code>costo = precio × descuento_saldo × TC</code>,{" "}
              <code>venta = costo × multiplicador</code>, redondeado.
            </p>
          </header>
          <div className="tc-update-bar">
            <button
              type="button"
              className="secondary"
              onClick={updateTc}
              disabled={tcUpdating}
            >
              {tcUpdating ? "Consultando…" : "Actualizar TC"}
            </button>
            {tcMsg && <span className="field-hint">{tcMsg}</span>}
            <span className="muted" style={{ marginLeft: "auto", fontSize: "0.75rem" }}>
              Fuente: mindicador.cl · Solo USD disponible
            </span>
          </div>

          <h4 className="settings-subheader">Tipos de cambio</h4>
          <div className="field-grid">
            {numField("usdToClp", "USD → CLP", "Dólar estadounidense", 1)}
            {numField("brlToClp", "BRL → CLP", "Real brasileño", 0.1)}
            {numField("tryToClp", "TRY → CLP", "Lira turca", 0.1)}
            {numField("jpyToClp", "JPY → CLP", "Yen japonés", 0.01)}
          </div>

          <h4 className="settings-subheader">Descuento de saldo por región</h4>
          <p className="help">
            Cuánto pagas por cada $1 de saldo PSN. Ej: 0.80 = compras $10 saldo por $8.
            Usa 1.00 si compras al precio normal (sin descuento).
          </p>
          <div className="field-grid">
            {numField("balanceDiscountUsd", "Descuento saldo USD", "Ej: 0.80 = pagas 80¢ por $1")}
            {numField("balanceDiscountBrl", "Descuento saldo BRL", "1.00 = sin descuento")}
            {numField("balanceDiscountTry", "Descuento saldo TRY", "1.00 = sin descuento")}
          </div>

          <h4 className="settings-subheader">Multiplicadores de venta</h4>
          <p className="help">
            Se aplican sobre el costo real. Vendes 2 primarias + 1 secundaria por cada compra.
            La secundaria es más barata (mult &lt; 1.0) porque las primarias ya cubren el costo.
          </p>
          <div className="field-grid">
            {numField("primariaMult", "Primaria", "Acceso completo, offline. Ej: 1.25")}
            {numField("secundariaMult", "Secundaria", "Más barata, requiere internet. Ej: 0.70")}
            <label className="field">
              <span className="field-label">Redondeo CLP</span>
              <input
                type="number"
                step={100}
                value={pricing.roundTo}
                onChange={(e) =>
                  setPricing((p) => ({ ...p, roundTo: parseInt(e.target.value) || 0 }))
                }
              />
              <span className="field-hint">Paso de redondeo (ej: 500)</span>
            </label>
          </div>
        </section>

        <section ref={refs.sources} className="settings-section" id="sources">
          <header className="settings-section-header">
            <h3>Plataformas y regiones</h3>
            <p className="help">
              Activa las fuentes que quieres scrapear. El botón "Actualizar ofertas"
              consultará todas las fuentes activas. Puedes pegar la URL de ofertas
              de cada tienda para configurar qué página se analiza.
            </p>
          </header>
          <div className="sources-list">
            {sources.map((s, i) => {
              const label = PLATFORM_LABELS[s.platform] || s.platform;
              const currency =
                s.region === "br" ? "BRL" : s.region === "tr" ? "TRY" : s.region === "jp" ? "JPY" : "USD";
              const defaultUrl = SOURCE_DEFAULT_URLS[`${s.platform}:${s.region}`] || "";

              return (
                <div className={`source-card${s.enabled ? "" : " source-disabled"}`} key={`${s.platform}-${s.region}`}>
                  <div className="source-card-header">
                    <input
                      type="checkbox"
                      checked={s.enabled}
                      onChange={(e) => toggleSource(i, e.target.checked)}
                    />
                    <span className={`platform-badge platform-${s.platform}`}>
                      {label}
                    </span>
                    <span className="source-region">{s.region.toUpperCase()}</span>
                    <span className="muted">{currency}</span>
                  </div>
                  <div className="source-card-body">
                    {s.platform === "psn" && (
                      <label className="source-field">
                        <span className="source-field-label">Category ID</span>
                        <input
                          className="source-input"
                          value={s.categoryId || ""}
                          placeholder="UUID de categoría de ofertas…"
                          onChange={(e) => updateSourceField(i, "categoryId", e.target.value)}
                        />
                      </label>
                    )}
                    <label className="source-field">
                      <span className="source-field-label">URL de ofertas</span>
                      <input
                        className="source-input"
                        value={s.url || ""}
                        placeholder={defaultUrl || "URL de la página de ofertas…"}
                        onChange={(e) => updateSourceField(i, "url", e.target.value)}
                      />
                      {defaultUrl && !s.url && (
                        <span className="source-field-hint">
                          Por defecto: <a href={defaultUrl} target="_blank" rel="noreferrer">{defaultUrl.replace(/^https?:\/\//, "").slice(0, 60)}</a>
                        </span>
                      )}
                    </label>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <section ref={refs.psn} className="settings-section" id="psn">
          <header className="settings-section-header">
            <h3>PSN (legado)</h3>
            <p className="help">
              Config PSN clásica. El Category ID también se puede configurar
              arriba en la sección de plataformas.
            </p>
          </header>
          <div className="field-grid">
            <label className="field">
              <span className="field-label">Región</span>
              <input
                value={psn.region}
                onChange={(e) => setPsn((p) => ({ ...p, region: e.target.value }))}
              />
              <span className="field-hint">Ej: en-US (más ofertas, tax-free)</span>
            </label>
            <label className="field wide">
              <span className="field-label">Category ID</span>
              <input
                value={psn.dealsCategoryId}
                onChange={(e) =>
                  setPsn((p) => ({ ...p, dealsCategoryId: e.target.value }))
                }
              />
              <span className="field-hint">UUID de la categoría de ofertas</span>
            </label>
          </div>
          <label className="chk-field">
            <input
              type="checkbox"
              checked={psn.includeAddOns}
              onChange={(e) =>
                setPsn((p) => ({ ...p, includeAddOns: e.target.checked }))
              }
            />
            <span>
              <strong>Incluir DLC / add-ons / monedas / temas</strong>
              <span className="field-hint">
                Por defecto solo traemos Full Game, Game Bundle, Premium Edition y Bundle.
              </span>
            </span>
          </label>
        </section>

        <section ref={refs.competitors} className="settings-section" id="competitors">
          <header className="settings-section-header">
            <h3>Competencia</h3>
            <p className="help">
              Shopify expone <code>/products.json</code>; WooCommerce expone{" "}
              <code>/wp-json/wc/store/v1/products</code>. Si no sabés qué usa, dejá{" "}
              <em>auto</em>.
            </p>
          </header>
          <div className="competitors">
            <div className="competitor-row competitor-head">
              <span></span>
              <span>Nombre</span>
              <span>Dominio</span>
              <span>Tipo</span>
              <span>Productos</span>
              <span></span>
            </div>
            {competitors.map((c, i) => (
              <div className="competitor-row" key={c.key + i}>
                <input
                  type="checkbox"
                  checked={c.enabled}
                  onChange={(e) => updateCompetitor(i, { enabled: e.target.checked })}
                />
                <input
                  value={c.label}
                  onChange={(e) => updateCompetitor(i, { label: e.target.value })}
                />
                <input
                  value={c.domain}
                  placeholder="ejemplo.cl"
                  onChange={(e) => updateCompetitor(i, { domain: e.target.value })}
                />
                <select
                  value={c.type}
                  onChange={(e) =>
                    updateCompetitor(i, { type: e.target.value as CompetitorType })
                  }
                >
                  <option value="auto">auto-detectar</option>
                  <option value="shopify">Shopify</option>
                  <option value="woocommerce">WooCommerce</option>
                  <option value="jumpseller">Jumpseller</option>
                  <option value="html">HTML (sitemap + JSON-LD)</option>
                </select>
                <span className="muted">
                  {c.productCount}
                  {c.refreshedAt ? ` · ${c.refreshedAt.slice(0, 10)}` : " · nunca"}
                </span>
                <button className="link danger" onClick={() => removeCompetitor(i)}>
                  ✕
                </button>
              </div>
            ))}
            <button className="add-competitor" onClick={addCompetitor}>
              + Agregar tienda
            </button>
          </div>
        </section>

        <div className="settings-save-bar">
          <span className="muted">
            {dirty ? "Hay cambios sin guardar" : "Todo al día"}
          </span>
          <button className="primary" onClick={save} disabled={saving}>
            {saving ? "Guardando…" : "Guardar cambios"}
          </button>
        </div>
      </div>
    </section>
  );
}
