import { useEffect, useState } from "react";
import {
  addToWatchlist,
  listWatchlist,
  removeFromWatchlist,
} from "../api";
import type { WatchedGame } from "../types";

interface Props {
  onClose: () => void;
}

const fmtUSD = (cents: number | null) =>
  cents == null ? "—" : "$" + (cents / 100).toFixed(2);

/** Deterministic label for the current status of a watched game. */
function statusLabel(s: WatchedGame["lastStatus"]): { text: string; cls: string } {
  switch (s) {
    case "on_sale":
      return { text: "En oferta", cls: "badge ok" };
    case "off_sale":
      return { text: "Fuera de ofertas", cls: "badge" };
    default:
      return { text: "Nunca visto", cls: "badge muted" };
  }
}

function fmtDate(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  return isNaN(d.getTime()) ? "—" : d.toLocaleDateString("es-CL");
}

export function WatchlistPanel({ onClose }: Props) {
  const [items, setItems] = useState<WatchedGame[]>([]);
  const [loading, setLoading] = useState(true);
  const [input, setInput] = useState("");
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reload = async () => {
    setLoading(true);
    try {
      const { items } = await listWatchlist();
      setItems(items);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    reload();
  }, []);

  const onAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || adding) return;
    setAdding(true);
    setError(null);
    try {
      await addToWatchlist(trimmed);
      setInput("");
      await reload();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setAdding(false);
    }
  };

  const onRemove = async (id: string) => {
    if (!confirm("¿Quitar del seguimiento?")) return;
    try {
      await removeFromWatchlist(id);
      setItems((prev) => prev.filter((w) => w.id !== id));
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const sorted = [...items].sort((a, b) => {
    // On-sale first, then off-sale, then unseen; by name within group.
    const order = (s: WatchedGame["lastStatus"]) =>
      s === "on_sale" ? 0 : s === "off_sale" ? 1 : 2;
    const d = order(a.lastStatus) - order(b.lastStatus);
    return d !== 0 ? d : a.name.localeCompare(b.name);
  });

  return (
    <section className="detail">
      <div className="detail-top">
        <button onClick={onClose} className="back" title="Volver al panel">
          <span aria-hidden="true">←</span> Volver al panel
        </button>
        <h2 className="detail-hero-title" style={{ margin: 0 }}>
          Seguimiento
        </h2>
      </div>

      <form className="watchlist-add" onSubmit={onAdd}>
        <input
          type="text"
          placeholder="Pegá la URL de PSN (https://store.playstation.com/en-us/product/UP…)"
          value={input}
          onChange={(e) => setInput(e.target.value)}
        />
        <button type="submit" disabled={adding || !input.trim()}>
          {adding ? "Agregando…" : "Agregar"}
        </button>
      </form>

      {error && <div className="status err">{error}</div>}

      {loading ? (
        <div className="loading">Cargando…</div>
      ) : items.length === 0 ? (
        <div className="empty">
          Todavía no seguís ningún juego. Pegá la URL de un producto en PSN
          (ej: <code>https://store.playstation.com/en-us/product/UP9000-…</code>)
          y te avisaremos cuando entre en oferta.
        </div>
      ) : (
        <div className="table-wrap">
          <table className="games">
            <thead>
              <tr>
                <th>Juego</th>
                <th>Estado</th>
                <th>Último precio</th>
                <th>Mejor dcto</th>
                <th>Última vez en oferta</th>
                <th>Agregado</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((w) => {
                const s = statusLabel(w.lastStatus);
                return (
                  <tr key={w.id}>
                    <td className="name">
                      <a
                        href={`https://store.playstation.com/en-us/product/${w.id}`}
                        target="_blank"
                        rel="noopener"
                      >
                        {w.name}
                      </a>
                      <div className="notes muted">{w.id}</div>
                    </td>
                    <td>
                      <span className={s.cls}>{s.text}</span>
                    </td>
                    <td>{fmtUSD(w.lastPriceCents)}</td>
                    <td>
                      {w.lastDiscountPercent > 0 ? (
                        <span className="pill">-{w.lastDiscountPercent}%</span>
                      ) : (
                        <span className="muted">—</span>
                      )}
                    </td>
                    <td className="muted">{fmtDate(w.lastSeenOnSaleAt)}</td>
                    <td className="muted">{fmtDate(w.addedAt)}</td>
                    <td>
                      <button
                        className="link"
                        onClick={() => onRemove(w.id)}
                        title="Quitar del seguimiento"
                      >
                        Quitar
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
