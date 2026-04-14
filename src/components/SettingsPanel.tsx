import { useEffect, useMemo, useRef, useState } from "react";
import { getCompetitors, putCompetitors, putSettings } from "../api";
import type {
  CompetitorStatus,
  CompetitorType,
  PricingSettings,
  PsnConfig,
  SettingsResponse,
} from "../types";

interface Props {
  initial: SettingsResponse;
  onSaved: (s: SettingsResponse) => void;
}

type SectionId = "pricing" | "psn" | "competitors";

const SECTIONS: { id: SectionId; label: string; hint: string }[] = [
  { id: "pricing", label: "Precios", hint: "Tipo de cambio y multiplicadores" },
  { id: "psn", label: "PSN", hint: "Región y categoría de ofertas" },
  { id: "competitors", label: "Competencia", hint: "Tiendas a scrapear" },
];

export function SettingsPanel({ initial, onSaved }: Props) {
  const [pricing, setPricing] = useState<PricingSettings>(initial.pricing);
  const [psn, setPsn] = useState<PsnConfig>(initial.psn);
  const [competitors, setCompetitors] = useState<CompetitorStatus[]>([]);
  const [saving, setSaving] = useState(false);
  const [active, setActive] = useState<SectionId>("pricing");

  const refs = {
    pricing: useRef<HTMLDivElement>(null),
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
      // We don't track competitors' previous state, so err on the side of
      // "always allow saving" when the list is loaded.
      competitors.length > 0
    );
  }, [pricing, psn, initial, competitors]);

  const save = async () => {
    setSaving(true);
    try {
      const r = await putSettings({ pricing, psn });
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

  const goto = (id: SectionId) => {
    setActive(id);
    refs[id].current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

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
              Fórmula: <code>cost = precioUSD × USD→CLP × (1 + fee)</code>,{" "}
              <code>venta = cost × multiplicador</code>, redondeado.
            </p>
          </header>
          <div className="field-grid">
            {numField("usdToClp", "USD → CLP", "Tipo de cambio", 1)}
            {numField("purchaseFeePct", "Fee de compra", "Tarjeta / PayPal (0.05 = 5%)")}
            {numField("primaria1Mult", "Multiplicador primaria 1", "Margen sobre el costo CLP")}
            {numField("primaria2Mult", "Multiplicador primaria 2", "Margen sobre el costo CLP")}
            {numField("secundariaMult", "Multiplicador secundaria", "Margen sobre el costo CLP")}
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

        <section ref={refs.psn} className="settings-section" id="psn">
          <header className="settings-section-header">
            <h3>PSN</h3>
            <p className="help">
              El scraper parsea{" "}
              <code>store.playstation.com/&lt;region&gt;/category/&lt;id&gt;</code>.
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
              <span className="field-hint">UUID de la categoría de ofertas (cambia cada semana)</span>
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
