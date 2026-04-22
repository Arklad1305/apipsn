import { useEffect, useState } from "react";
import { getPsPlus } from "../api";
import type { PlusPlanWithMatches, PlusRegionPrice, PlusTier } from "../types";

const fmtCLP = (n: number | null) =>
  n == null ? "—" : "$" + Math.round(n).toLocaleString("es-CL");

const TIER_LABELS: Record<PlusTier, string> = {
  essential: "Essential",
  extra: "Extra",
  premium: "Premium",
};

const TIER_COLORS: Record<PlusTier, string> = {
  essential: "#f5c518",
  extra: "#1e90ff",
  premium: "#a855f7",
};

const REGION_FLAGS: Record<string, string> = {
  us: "US",
  br: "BR",
  tr: "TR",
};

const CURRENCY_SYMBOLS: Record<string, string> = {
  USD: "US$",
  BRL: "R$",
  TRY: "₺",
};

function fmtLocal(rp: PlusRegionPrice): string {
  const sym = CURRENCY_SYMBOLS[rp.currency] ?? rp.currency;
  const val = rp.price % 1 === 0 ? rp.price.toString() : rp.price.toFixed(2);
  return `${sym}${val}`;
}

export function PsPlusPanel() {
  const [plans, setPlans] = useState<PlusPlanWithMatches[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    getPsPlus()
      .then((r) => setPlans(r.plans))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading">Cargando precios PS Plus…</div>;
  if (!plans.length) return <div className="empty">No hay datos de PS Plus. Actualiza la competencia primero.</div>;

  const tiers: PlusTier[] = ["essential", "extra", "premium"];

  return (
    <div className="psplus-panel">
      <p className="psplus-hint">
        Precios oficiales PSN en USD, BRL y TRY → CLP estimado. Se destaca la región más barata.
        Competidores se actualizan con "Actualizar competencia".
      </p>
      <div className="psplus-grid">
        {tiers.map((tier) => {
          const tierPlans = plans.filter((p) => p.tier === tier);
          return (
            <div key={tier} className="psplus-tier" style={{ borderColor: TIER_COLORS[tier] }}>
              <h4 className="psplus-tier-title" style={{ color: TIER_COLORS[tier] }}>
                {TIER_LABELS[tier]}
              </h4>
              {tierPlans.map((plan) => (
                <div key={plan.duration} className="psplus-plan">
                  <div className="psplus-plan-header">
                    <span className="psplus-duration">
                      {plan.duration === "1m" ? "1 Mes" : plan.duration === "3m" ? "3 Meses" : "12 Meses"}
                    </span>
                  </div>

                  <div className="psplus-regions">
                    {plan.regionPrices.map((rp) => {
                      const isCheapest = plan.cheapestRegion === rp.region;
                      return (
                        <div
                          key={rp.region}
                          className={`psplus-region${isCheapest ? " psplus-region-best" : ""}`}
                        >
                          <span className="psplus-region-flag">{REGION_FLAGS[rp.region]}</span>
                          <span className="psplus-region-local">{fmtLocal(rp)}</span>
                          <span className="psplus-region-clp">
                            {fmtCLP(rp.priceClp)}
                            {isCheapest && <span className="psplus-cheapest-tag">menor</span>}
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  {plan.competitorMatches.length > 0 ? (
                    <div className="psplus-matches">
                      <div className="psplus-matches-label">Competencia:</div>
                      {plan.competitorMatches.map((m, i) => {
                        const hasSavings =
                          plan.cheapestClp != null &&
                          m.priceClp < plan.cheapestClp;
                        return (
                          <a
                            key={i}
                            href={m.url}
                            target="_blank"
                            rel="noopener"
                            className={`psplus-match${i === 0 && hasSavings ? " psplus-best" : ""}`}
                          >
                            <span className="psplus-store">{m.storeKey}</span>
                            <span className="psplus-price">
                              {fmtCLP(m.priceClp)}
                              {i === 0 && hasSavings && plan.cheapestClp && (
                                <span className="psplus-saving">
                                  {" "}-{Math.round(((plan.cheapestClp - m.priceClp) / plan.cheapestClp) * 100)}%
                                </span>
                              )}
                            </span>
                          </a>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="psplus-no-match muted">Sin ofertas en competencia</div>
                  )}
                </div>
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}
