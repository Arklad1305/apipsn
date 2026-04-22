import { useEffect, useState } from "react";
import { getPsPlus } from "../api";
import type { PlusPlanWithMatches, PlusTier } from "../types";

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
        Precios oficiales PSN (USD → CLP estimado) vs precios en tiendas competidoras.
        Los datos de competidores se actualizan con "Actualizar competencia".
      </p>
      <div className="psplus-grid">
        {tiers.map((tier) => {
          const tierPlans = plans.filter((p) => p.tier === tier);
          return (
            <div key={tier} className="psplus-tier" style={{ borderColor: TIER_COLORS[tier] }}>
              <h4 className="psplus-tier-title" style={{ color: TIER_COLORS[tier] }}>
                {TIER_LABELS[tier]}
              </h4>
              {tierPlans.map((plan) => {
                const hasSavings =
                  plan.bestPrice != null &&
                  plan.officialPriceClp != null &&
                  plan.bestPrice < plan.officialPriceClp;
                const savingsPct =
                  hasSavings && plan.officialPriceClp
                    ? Math.round(((plan.officialPriceClp - plan.bestPrice!) / plan.officialPriceClp) * 100)
                    : 0;

                return (
                  <div key={plan.duration} className="psplus-plan">
                    <div className="psplus-plan-header">
                      <span className="psplus-duration">
                        {plan.duration === "1m" ? "1 Mes" : plan.duration === "3m" ? "3 Meses" : "12 Meses"}
                      </span>
                      <span className="psplus-official" title="Precio oficial PSN (USD → CLP)">
                        {plan.officialPriceUsd != null ? `US$${plan.officialPriceUsd}` : "—"}{" "}
                        <span className="muted">≈ {fmtCLP(plan.officialPriceClp)}</span>
                      </span>
                    </div>

                    {plan.competitorMatches.length > 0 ? (
                      <div className="psplus-matches">
                        {plan.competitorMatches.map((m, i) => (
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
                              {i === 0 && hasSavings && (
                                <span className="psplus-saving"> -{savingsPct}%</span>
                              )}
                            </span>
                          </a>
                        ))}
                      </div>
                    ) : (
                      <div className="psplus-no-match muted">Sin ofertas en competencia</div>
                    )}
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}
