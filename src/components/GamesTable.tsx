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
            <th>Fin</th>
            <th>Sel</th>
            <th>Pub</th>
          </tr>
        </thead>
        <tbody>
          {games.map((g) => (
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
          ))}
        </tbody>
      </table>
    </div>
  );
}
