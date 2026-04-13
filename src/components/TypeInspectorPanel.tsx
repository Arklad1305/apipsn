import type { ProductTypeInspection } from "../api";

interface Props {
  report: ProductTypeInspection;
  onClose: () => void;
}

export function TypeInspectorPanel({ report, onClose }: Props) {
  const rows = report.classifications;
  const totalFromRows = rows.reduce((s, r) => s + r.count, 0);

  return (
    <section className="settings">
      <header>
        <button onClick={onClose} className="back" title="Volver al panel">
          <span aria-hidden="true">←</span> Volver al panel
        </button>
        <h2>Inspección de tipos · {report.totalSeen.toLocaleString("es-CL")} productos</h2>
      </header>

      <div className="group">
        <h3>Clasificaciones encontradas</h3>
        <div className="table-wrap">
          <table className="games">
            <thead>
              <tr>
                <th>classification</th>
                <th>productType</th>
                <th style={{ textAlign: "right" }}>count</th>
                <th style={{ textAlign: "right" }}>%</th>
                <th>ejemplos</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => {
                const pct = totalFromRows
                  ? ((r.count * 100) / totalFromRows).toFixed(1)
                  : "0";
                return (
                  <tr key={i}>
                    <td>
                      {r.classification || <span className="muted">—</span>}
                    </td>
                    <td>
                      {r.productType || <span className="muted">—</span>}
                    </td>
                    <td
                      className="price"
                      style={{ textAlign: "right", fontVariantNumeric: "tabular-nums" }}
                    >
                      {r.count.toLocaleString("es-CL")}
                    </td>
                    <td
                      className="muted"
                      style={{ textAlign: "right", fontVariantNumeric: "tabular-nums" }}
                    >
                      {pct}%
                    </td>
                    <td className="muted" style={{ maxWidth: 380 }}>
                      {r.samples.join(" · ")}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <p className="help">
          Usá esta tabla para definir qué <code>classification</code> /{" "}
          <code>productType</code> entran al catálogo (los "juegos reales") y
          cuáles se filtran (DLC, monedas, temas, avatares).
        </p>
      </div>

      <div className="group">
        <h3>Campos observados en los productos</h3>
        <div className="type-keys">
          {report.observedKeys.map((k) => (
            <div className="type-key" key={k.key}>
              <code>{k.key}</code>
              <span className="muted" title={k.example}>
                {k.example}
              </span>
            </div>
          ))}
        </div>
        <p className="help">
          Si tu clasificación no está acá, el nombre del campo cambió — me lo
          pasás y ajusto el discriminador.
        </p>
      </div>
    </section>
  );
}
