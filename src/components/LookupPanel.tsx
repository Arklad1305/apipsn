import { useState } from "react";
import { lookupGames } from "../api";
import type { LookupItem, LookupResult } from "../types";

function parseCompetitorPaste(text: string): LookupItem[] {
  const items: LookupItem[] = [];
  const seen = new Set<string>();

  const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);

  const priceRe = /^\$?([\d,.]+)\s*(?:[–—-]\s*\$?([\d,.]+))?$/;
  const noiseRe =
    /^(?:add to wishlist|compare|quick view|new|this product has multiple variants|the options may be chosen)$/i;

  let i = 0;
  while (i < lines.length) {
    const line = lines[i];

    if (noiseRe.test(line) || priceRe.test(line)) {
      i++;
      continue;
    }

    const candidateName = line;

    let priceMin: number | null = null;
    let priceMax: number | null = null;
    let j = i + 1;
    while (j < lines.length && j <= i + 6) {
      const pMatch = priceRe.exec(lines[j]);
      if (pMatch) {
        priceMin = parseFloat(pMatch[1].replace(",", "")) || null;
        priceMax = pMatch[2] ? parseFloat(pMatch[2].replace(",", "")) || null : priceMin;
        j++;
        break;
      }
      if (noiseRe.test(lines[j]) || lines[j] === candidateName) {
        j++;
        continue;
      }
      break;
    }

    const key = candidateName.toLowerCase();
    if (!seen.has(key)) {
      seen.add(key);
      items.push({ name: candidateName, priceMin, priceMax });
    }
    i = j;
  }

  return items;
}

const fmtCLP = (n: number | null) =>
  n == null ? "—" : "$" + Math.round(n).toLocaleString("es-CL");

const fmtUSD = (n: number | null) =>
  n == null ? "—" : `US$${n.toFixed(2)}`;

export function LookupPanel() {
  const [rawText, setRawText] = useState("");
  const [results, setResults] = useState<LookupResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [parsed, setParsed] = useState<LookupItem[]>([]);

  const onSearch = async () => {
    const items = parseCompetitorPaste(rawText);
    setParsed(items);
    if (!items.length) return;

    setLoading(true);
    try {
      const r = await lookupGames(items);
      setResults(r.results);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const foundCount = results.filter((r) => r.found).length;

  return (
    <div className="lookup-panel">
      <p className="lookup-hint">
        Pega la lista de productos de un competidor (nombre + precio). Se busca cada
        uno en tu base de datos para comparar precios.
      </p>

      <div className="lookup-input">
        <textarea
          className="lookup-textarea"
          rows={8}
          placeholder={"Ghost of Tsushima: DIRECTOR'S CUT\n$22.99 – $50.99\nThe Witcher 3 Wild Hunt\n$7.99\n..."}
          value={rawText}
          onChange={(e) => setRawText(e.target.value)}
        />
        <div className="lookup-actions">
          <button className="btn" onClick={onSearch} disabled={loading || !rawText.trim()}>
            {loading ? "Buscando…" : "Buscar"}
          </button>
          {parsed.length > 0 && (
            <span className="muted" style={{ fontSize: "0.8rem" }}>
              {parsed.length} productos parseados
              {results.length > 0 && ` · ${foundCount} encontrados`}
            </span>
          )}
          {results.length > 0 && (
            <button
              className="btn btn-sm"
              onClick={() => { setResults([]); setParsed([]); setRawText(""); }}
            >
              Limpiar
            </button>
          )}
        </div>
      </div>

      {results.length > 0 && (
        <div className="lookup-results">
          <table className="lookup-table">
            <thead>
              <tr>
                <th>Producto (competidor)</th>
                <th>Precio comp.</th>
                <th>Match</th>
                <th>Juego encontrado</th>
                <th>Plat.</th>
                <th>Precio PSN</th>
                <th>Desc.</th>
                <th>Costo CLP</th>
                <th>Primaria</th>
                <th>Secundaria</th>
              </tr>
            </thead>
            <tbody>
              {results.map((r, i) => (
                <tr key={i} className={r.found ? "" : "lookup-no-match"}>
                  <td className="lookup-query">{r.query}</td>
                  <td>
                    {r.priceMin != null
                      ? r.priceMax && r.priceMax !== r.priceMin
                        ? `$${r.priceMin} – $${r.priceMax}`
                        : `$${r.priceMin}`
                      : "—"}
                  </td>
                  <td>
                    {r.found ? (
                      <span className={`lookup-score ${r.matchScore >= 0.7 ? "high" : r.matchScore >= 0.5 ? "mid" : "low"}`}>
                        {Math.round(r.matchScore * 100)}%
                      </span>
                    ) : (
                      <span className="muted">—</span>
                    )}
                  </td>
                  <td className="lookup-matched-name">
                    {r.game ? (
                      <a
                        href={r.game.storeUrl || "#"}
                        target="_blank"
                        rel="noopener"
                        title={r.game.name}
                      >
                        {r.game.name}
                      </a>
                    ) : (
                      <span className="muted">No encontrado</span>
                    )}
                  </td>
                  <td>{r.game?.platform?.toUpperCase() ?? "—"}</td>
                  <td>{r.game ? fmtUSD(r.game.priceDiscounted) : "—"}</td>
                  <td>
                    {r.game && r.game.discountPercent > 0 ? (
                      <span className="discount-badge">-{r.game.discountPercent}%</span>
                    ) : "—"}
                  </td>
                  <td>{r.game ? fmtCLP(r.game.costClp) : "—"}</td>
                  <td>{r.game ? fmtCLP(r.game.primaria) : "—"}</td>
                  <td>{r.game ? fmtCLP(r.game.secundaria) : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
