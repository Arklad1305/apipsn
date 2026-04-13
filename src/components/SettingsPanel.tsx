import { useEffect, useState } from "react";
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
  onClose: () => void;
}

export function SettingsPanel({ initial, onSaved, onClose }: Props) {
  const [pricing, setPricing] = useState<PricingSettings>(initial.pricing);
  const [psn, setPsn] = useState<PsnConfig>(initial.psn);
  const [competitors, setCompetitors] = useState<CompetitorStatus[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getCompetitors()
      .then((r) => setCompetitors(r.competitors))
      .catch(() => {});
  }, []);

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

  const numField = <K extends keyof PricingSettings>(k: K, label: string, step = 0.01) => (
    <label key={k}>
      {label}
      <input
        type="number"
        step={step}
        value={pricing[k] as number}
        onChange={(e) =>
          setPricing((p) => ({ ...p, [k]: Number(e.target.value) }))
        }
      />
    </label>
  );

  return (
    <section className="settings">
      <header>
        <h2>Ajustes</h2>
        <button onClick={onClose} className="link">
          ✕
        </button>
      </header>

      <div className="group">
        <h3>Precios</h3>
        <div className="grid">
          {numField("usdToClp", "USD → CLP", 1)}
          {numField("purchaseFeePct", "Fee compra (0.05 = 5%)")}
          {numField("primaria1Mult", "Multiplicador primaria 1")}
          {numField("primaria2Mult", "Multiplicador primaria 2")}
          {numField("secundariaMult", "Multiplicador secundaria")}
          <label>
            Redondeo CLP
            <input
              type="number"
              step={100}
              value={pricing.roundTo}
              onChange={(e) =>
                setPricing((p) => ({ ...p, roundTo: parseInt(e.target.value) || 0 }))
              }
            />
          </label>
        </div>
        <p className="help">
          Fórmula: <code>cost = precioUSD × USD→CLP × (1 + fee)</code>,{" "}
          <code>venta = cost × multiplicador</code>, redondeado.
        </p>
      </div>

      <div className="group">
        <h3>PSN API</h3>
        <div className="grid">
          <label>
            Región
            <input
              value={psn.region}
              onChange={(e) => setPsn((p) => ({ ...p, region: e.target.value }))}
            />
          </label>
          <label className="wide">
            Category ID (UUID de ofertas)
            <input
              value={psn.dealsCategoryId}
              onChange={(e) =>
                setPsn((p) => ({ ...p, dealsCategoryId: e.target.value }))
              }
            />
          </label>
        </div>
        <p className="help">
          El scraper parsea el HTML de{" "}
          <code>store.playstation.com/&lt;region&gt;/category/&lt;id&gt;/&lt;page&gt;</code>.
          No hace falta mantener hashes ni tokens.
        </p>
      </div>

      <div className="group">
        <h3>Competidores</h3>
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
          <button onClick={addCompetitor}>+ Agregar tienda</button>
        </div>
        <p className="help">
          Shopify expone <code>/products.json</code>; WooCommerce expone{" "}
          <code>/wp-json/wc/store/v1/products</code>. Si no sabés qué usa, dejalo en{" "}
          <em>auto</em>. Luego clic en <strong>Actualizar competencia</strong>.
        </p>
      </div>

      <div className="actions">
        <button className="primary" onClick={save} disabled={saving}>
          {saving ? "Guardando…" : "Guardar"}
        </button>
        <button onClick={onClose}>Cancelar</button>
      </div>
    </section>
  );
}
