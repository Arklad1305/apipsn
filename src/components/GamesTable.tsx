import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { patchGame } from "../api";
import type { GameOut } from "../types";
import { animatePopIn, animateRowsIn } from "../anim";

interface Props {
  games: GameOut[];
  onGameUpdated: (g: GameOut) => void;
}

const fmtCLP = (n: number | null) =>
  n == null ? "" : "$" + Math.round(n).toLocaleString("es-CL");
const fmtUSD = (n: number | null) => (n == null ? "" : "$" + n.toFixed(2));

interface OpenPopover {
  gameId: string;
  anchor: { top: number; left: number; right: number; bottom: number };
}

export function GamesTable({ games, onGameUpdated }: Props) {
  const [open, setOpen] = useState<OpenPopover | null>(null);
  const tbodyRef = useRef<HTMLTableSectionElement>(null);
  const prevKeyRef = useRef<string>("");

  useLayoutEffect(() => {
    if (!tbodyRef.current) return;
    // Re-animate when the set of games changes (filter/sort/reload).
    const key = games.map((g) => g.id).join("|");
    if (key === prevKeyRef.current) return;
    prevKeyRef.current = key;
    const rows = Array.from(tbodyRef.current.querySelectorAll("tr"));
    animateRowsIn(rows);
  }, [games]);

  const toggle = async (
    g: GameOut,
    field: "selected" | "published",
    value: boolean
  ) => {
    const updated = await patchGame(g.id, { [field]: value });
    onGameUpdated(updated);
  };

  const openPopover = (gameId: string, el: HTMLElement) => {
    const r = el.getBoundingClientRect();
    setOpen({
      gameId,
      anchor: { top: r.top, left: r.left, right: r.right, bottom: r.bottom },
    });
  };

  const openGame = open ? games.find((g) => g.id === open.gameId) : null;

  return (
    <>
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
          <tbody ref={tbodyRef}>
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
                        onClick={(e) =>
                          open?.gameId === g.id
                            ? setOpen(null)
                            : openPopover(g.id, e.currentTarget)
                        }
                        title="Ver tiendas"
                      >
                        {fmtCLP(g.marketMin)}{" "}
                        <span className="market-count">({g.marketCount})</span>
                      </button>
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

      {open && openGame && openGame.marketMatches.length > 0 && (
        <MarketPopover
          game={openGame}
          anchor={open.anchor}
          onClose={() => setOpen(null)}
        />
      )}
    </>
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

interface PopoverProps {
  game: GameOut;
  anchor: { top: number; left: number; right: number; bottom: number };
  onClose: () => void;
}

function MarketPopover({ game, anchor, onClose }: PopoverProps) {
  const ref = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (ref.current) animatePopIn(ref.current);
  }, []);

  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (!ref.current) return;
      if (!ref.current.contains(e.target as Node)) onClose();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    // Defer the click listener by a tick so the click that opened us doesn't
    // immediately close it.
    const t = setTimeout(() => document.addEventListener("click", onDocClick), 0);
    document.addEventListener("keydown", onKey);
    return () => {
      clearTimeout(t);
      document.removeEventListener("click", onDocClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  // Position below the anchor; flip above if we'd overflow the viewport bottom.
  const popW = 380;
  const popH = Math.min(60 + game.marketMatches.length * 32, 360);
  const margin = 8;
  let top = anchor.bottom + 4;
  if (top + popH > window.innerHeight - margin) {
    top = Math.max(margin, anchor.top - popH - 4);
  }
  let left = anchor.right - popW;
  if (left < margin) left = margin;
  if (left + popW > window.innerWidth - margin) {
    left = window.innerWidth - popW - margin;
  }

  return createPortal(
    <div
      ref={ref}
      className="market-popover"
      style={{ top, left, width: popW }}
      role="dialog"
    >
      <div className="market-popover-header">
        <span>
          {game.marketCount} tienda{game.marketCount === 1 ? "" : "s"}
          {" · "}
          <span className="muted" title={game.name}>
            {game.name}
          </span>
        </span>
        <button className="link" onClick={onClose} aria-label="Cerrar">
          ✕
        </button>
      </div>
      {game.marketMatches.map((m, i) => (
        <a
          key={i}
          href={m.url}
          target="_blank"
          rel="noopener"
          className="market-row"
          title={m.title}
        >
          <span className="market-store">{m.storeKey}</span>
          <span className="market-title">{m.title}</span>
          <span className="market-price">{fmtCLP(m.priceClp)}</span>
        </a>
      ))}
    </div>,
    document.body
  );
}
