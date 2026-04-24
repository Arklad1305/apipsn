import { useEffect, useState } from "react";

interface DebugProduct {
  id: string;
  name: string;
  tileImageFromHtml: string | null;
  mediaRolesFromJson: Array<{ role: string; url: string }>;
  tileImageUrl_assigned: boolean;
}

interface DebugResult {
  url: string;
  htmlLength: number;
  hasNextData: boolean;
  jsonProductCount: number;
  tileImageCount: number;
  products: DebugProduct[];
  firstTileHtmlSnippet: string | null;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export function DebugScrapeModal({ isOpen, onClose }: Props) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<DebugResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const runDebug = async () => {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch("/api/debug/scrape-images");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setResult(data);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <header className="modal-header">
          <h3>Diagnóstico de scraping PSN</h3>
          <button className="modal-close" onClick={onClose}>
            ✕
          </button>
        </header>

        <div className="modal-body">
          {!result && !error && (
            <div className="debug-initial">
              <p className="help">
                Vamos a scrapear la primera página de ofertas de PSN (5-10 productos)
                para verificar que estamos extrayendo las imágenes correctas (440×440).
              </p>
              <button
                className="primary"
                onClick={runDebug}
                disabled={loading}
              >
                {loading ? "Scrapeando…" : "Iniciar diagnóstico"}
              </button>
            </div>
          )}

          {error && (
            <div className="debug-error">
              <p className="status err">Error: {error}</p>
              <button className="secondary" onClick={runDebug} disabled={loading}>
                Reintentar
              </button>
            </div>
          )}

          {result && (
            <div className="debug-results">
              <div className="debug-stats">
                <dl>
                  <dt>URL scrapeada:</dt>
                  <dd>
                    <code>{result.url}</code>
                  </dd>
                  <dt>Tamaño HTML:</dt>
                  <dd>{(result.htmlLength / 1024).toFixed(1)} KB</dd>
                  <dt>__NEXT_DATA__ encontrado:</dt>
                  <dd>{result.hasNextData ? "✓ Sí" : "✗ No"}</dd>
                  <dt>Productos en JSON:</dt>
                  <dd>{result.jsonProductCount}</dd>
                  <dt>Imágenes extraídas del HTML:</dt>
                  <dd>{result.tileImageCount}</dd>
                </dl>
              </div>

              <section className="debug-products">
                <h4>Primeros {result.products.length} productos</h4>
                {result.products.length === 0 ? (
                  <p className="muted">No se encontraron productos.</p>
                ) : (
                  <div className="debug-product-list">
                    {result.products.map((p) => (
                      <div key={p.id} className="debug-product">
                        <div className="debug-product-header">
                          <span className="debug-product-name">{p.name}</span>
                          <span
                            className={`debug-badge ${
                              p.tileImageUrl_assigned ? "success" : "warning"
                            }`}
                          >
                            {p.tileImageUrl_assigned
                              ? "✓ Imagen extraída"
                              : "✗ No extraída"}
                          </span>
                        </div>
                        {p.tileImageFromHtml && (
                          <div className="debug-product-image">
                            <img
                              src={p.tileImageFromHtml}
                              alt={p.name}
                              onError={(e) => {
                                (e.target as HTMLImageElement).style.opacity = "0.5";
                              }}
                            />
                            <span className="debug-image-url">
                              {p.tileImageFromHtml.substring(0, 80)}…
                            </span>
                          </div>
                        )}
                        {p.mediaRolesFromJson.length > 0 && (
                          <div className="debug-media-roles">
                            <strong>Roles en JSON:</strong>
                            <ul>
                              {p.mediaRolesFromJson.map((m, i) => (
                                <li key={i}>
                                  <span className="role">{m.role}</span>
                                  {" → "}
                                  <span className="url">
                                    {m.url.substring(0, 60)}…
                                  </span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </section>

              {result.firstTileHtmlSnippet && (
                <section className="debug-html-snippet">
                  <h4>HTML del primer tile (para debugging regex)</h4>
                  <pre>{result.firstTileHtmlSnippet}</pre>
                </section>
              )}

              <div className="debug-actions">
                <button className="secondary" onClick={runDebug} disabled={loading}>
                  {loading ? "Ejecutando…" : "Ejecutar nuevamente"}
                </button>
                <button className="secondary" onClick={onClose}>
                  Cerrar
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
