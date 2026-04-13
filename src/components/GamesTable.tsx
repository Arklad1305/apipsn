import { useState } from "react";
import { patchGame } from "../api";
import type { GameOut } from "../types";

interface Props {
  games: GameOut[];
  onGameUpdated: (g: GameOut) => void;
}

const fmtCLP = (n: number | null) =>
  n == null ? "" : "$" + Math.round(n).toLocaleString("es-CL");
const fmtUSD = (n: number | null) => (n == null ? "" : "$" + n.toFixed(2));

export function GamesTable({ games, onGameUpdated }: Props) {
  const [openMatches, setOpenMatches] = useState<string | null>(null);

  const toggle = async (g: GameOut, field: "selected" | "published", value: boolean) => {
    const updated = await patchGame(g.id, { [field]: value });
    onGameUpdated(updated);
  };

  return (
    <div className="table-wrap">
      <table className="games">
        <thead>
          <tr>
            <th></th>
            <th>Juego</th>
            <th>Plataforma</th>
            <th>USD</th>
            <th>Dcto</th>
            <th>Costo CLP</th>
            <th>Primaria 1</th>
            <th>Primaria 2</th>
            <th>Secundaria</th>
            <th>Mercado</th>
            <th>Fin</th>
            <th>Sel</th>
            <th>Pub</th>
          </tr>
        </thead>
        <tbody>
          {games.map((g) => {
            const marketClass = marketColor(g);
            return (
              <tr key={g.id} className={g.published ? "published" : ""}>
                <td>
                  {g.imageUrl ? (
                    <img className="thumb" src={g.imageUrl} alt="" loading="lazy" />
                  ) : (
                    <div className="thumb placeholder" />
                  )}
                </td>
                <td className="name">
                  {g.storeUrl ? (
                    <a href={g.storeUrl} target="_blank" rel="noopener">
                      {g.name}
                    </a>
                  ) : (
                    g.name
                  )}
                  {g.notes && <div className="notes">{g.notes}</div>}
                </td>
                <td>{g.platforms}</td>
                <td>
                  {g.priceOriginalUsd != null &&
                    g.priceOriginalUsd !== g.priceDiscountedUsd && (
                      <s className="muted">{fmtUSD(g.priceOriginalUsd)}</s>
                    )}{" "}
                  <strong>{fmtUSD(g.priceDiscountedUsd)}</strong>
                </td>
                <td>
                  {g.discountPercent > 0 ? (
                    <span className="pill">-{g.discountPercent}%</span>
                  ) : (
                    <span className="muted">—</span>
                  )}
                </td>
                <td>{fmtCLP(g.costClp)}</td>
                <td className="price">{fmtCLP(g.primaria1)}</td>
                <td className="price">{fmtCLP(g.primaria2)}</td>
                <td className="price">{fmtCLP(g.secundaria)}</td>
                <td className={`market ${marketClass}`}>
                  {g.marketMin == null ? (
                    <span className="muted">—</span>
                  ) : (
                    <button
                      type="button"
                      className="link market-btn"
                      onClick={() =>
                        setOpenMatches(openMatches === g.id ? null : g.id)
                      }
                      title="Ver tiendas"
                    >
                      {fmtCLP(g.marketMin)}{" "}
                      <span className="market-count">({g.marketCount})</span>
                    </button>
                  )}
                  {openMatches === g.id && g.marketMatches.length > 0 && (
                    <MarketPopover game={g} onClose={() => setOpenMatches(null)} />
                  )}
                </td>
                <td className="muted">
                  {g.discountEndAt ? g.discountEndAt.slice(0, 10) : ""}
                </td>
                <td>
                  <input
                    type="checkbox"
                    checked={g.selected}
                    onChange={(e) => toggle(g, "selected", e.target.checked)}
                  />
                </td>
                <td>
                  <input
                    type="checkbox"
                    checked={g.published}
                    onChange={(e) => toggle(g, "published", e.target.checked)}
                  />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

/** Green if your secundaria price is at/below the market min (competitive);
 *  red if your primaria2 is above the market min (over-priced); neutral otherwise. */
function marketColor(g: GameOut): string {
  if (g.marketMin == null) return "";
  if (g.secundaria != null && g.secundaria <= g.marketMin) return "market-good";
  if (g.primaria2 != null && g.primaria2 > g.marketMin) return "market-bad";
  return "";
}

function MarketPopover({
  game,
  onClose,
}: {
  game: GameOut;
  onClose: () => void;
}) {
  return (
    <div className="market-popover" onMouseLeave={onClose}>
      <div className="market-popover-header">
        {game.marketCount} tienda{game.marketCount === 1 ? "" : "s"}
      </div>
      {game.marketMatches.map((m, i) => (
        <a
          key={i}
          href={m.url}
          target="_blank"
          rel="noopener"
          className="market-row"
        >
          <span className="market-store">{m.storeKey}</span>
          <span className="market-title" title={m.title}>
            {m.title}
          </span>
          <span className="market-price">{fmtCLP(m.priceClp)}</span>
        </a>
      ))}
    </div>
  );
}
