import { useState } from "react";
import { putSettings } from "../api";
import type {
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
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    try {
      const r = await putSettings({ pricing, psn });
      onSaved(r);
    } finally {
      setSaving(false);
    }
  };

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
          <label className="wide">
            SHA256 persisted query
            <input
              value={psn.categoryGridHash}
              onChange={(e) =>
                setPsn((p) => ({ ...p, categoryGridHash: e.target.value }))
              }
            />
          </label>
        </div>
        <p className="help">
          Para obtener el hash: abrí la página de ofertas en <code>store.playstation.com/en-us</code>,
          DevTools → Network → filtrá <code>graphql</code>, copiá{" "}
          <code>extensions.persistedQuery.sha256Hash</code> de una request a{" "}
          <code>operationName=categoryGridRetrieve</code>.
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
