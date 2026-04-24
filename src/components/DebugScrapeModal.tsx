import { useState } from "react";

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
    <div style={overlayStyle} onClick={onClose}>
      <div style={contentStyle} onClick={(e) => e.stopPropagation()}>
        <div style={headerStyle}>
          <h3 style={{ margin: 0, fontSize: 18 }}>Diagnóstico de scraping PSN</h3>
          <button onClick={onClose} style={closeBtnStyle}>✕</button>
        </div>

        <div style={bodyStyle}>
          {!result && !error && (
            <div style={{ textAlign: "center", padding: "32px 24px" }}>
              <p style={{ color: "var(--muted)", marginBottom: 16 }}>
                Vamos a scrapear la primera página de ofertas de PSN (5 productos)
                para verificar que estamos extrayendo las imágenes correctas (440×440).
              </p>
              <button
                className="primary"
                onClick={runDebug}
                disabled={loading}
              >
                {loading ? "Scrapeando..." : "Iniciar diagnóstico"}
              </button>
            </div>
          )}

          {error && (
            <div style={{ textAlign: "center", padding: 24 }}>
              <p style={{ color: "#ef4444", marginBottom: 16 }}>Error: {error}</p>
              <button className="secondary" onClick={runDebug} disabled={loading}>
                Reintentar
              </button>
            </div>
          )}

          {result && (
            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              <div style={statsStyle}>
                <div><strong>URL:</strong> <code style={{ fontSize: 11 }}>{result.url}</code></div>
                <div><strong>HTML:</strong> {(result.htmlLength / 1024).toFixed(1)} KB</div>
                <div><strong>__NEXT_DATA__:</strong> {result.hasNextData ? "Si" : "No"}</div>
                <div><strong>Productos JSON:</strong> {result.jsonProductCount}</div>
                <div><strong>Imágenes HTML:</strong> {result.tileImageCount}</div>
              </div>

              <h4 style={{ margin: 0 }}>Primeros {result.products.length} productos</h4>
              {result.products.map((p) => (
                <div key={p.id} style={productStyle}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
                    <strong style={{ fontSize: 13 }}>{p.name}</strong>
                    <span style={p.tileImageUrl_assigned ? badgeOk : badgeFail}>
                      {p.tileImageUrl_assigned ? "Imagen extraída" : "No extraída"}
                    </span>
                  </div>
                  {p.tileImageFromHtml && (
                    <div style={{ marginTop: 8 }}>
                      <img
                        src={p.tileImageFromHtml}
                        alt={p.name}
                        style={{ maxWidth: "100%", maxHeight: 120, borderRadius: 4, background: "#111" }}
                        onError={(e) => { (e.target as HTMLImageElement).style.opacity = "0.3"; }}
                      />
                      <div style={{ fontSize: 10, color: "var(--muted)", marginTop: 4, wordBreak: "break-all" }}>
                        {p.tileImageFromHtml.substring(0, 100)}
                      </div>
                    </div>
                  )}
                  {p.mediaRolesFromJson.length > 0 && (
                    <div style={{ marginTop: 8, fontSize: 11, color: "var(--muted)" }}>
                      <strong>Roles JSON:</strong>
                      <ul style={{ margin: "4px 0 0", paddingLeft: 16 }}>
                        {p.mediaRolesFromJson.map((m, i) => (
                          <li key={i}>
                            <code>{m.role}</code> → {m.url.substring(0, 50)}...
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ))}

              {result.firstTileHtmlSnippet && (
                <div>
                  <h4 style={{ margin: "0 0 8px" }}>HTML del primer tile (debug regex)</h4>
                  <pre style={preStyle}>{result.firstTileHtmlSnippet}</pre>
                </div>
              )}

              <div style={{ display: "flex", gap: 12, justifyContent: "center", paddingTop: 12, borderTop: "1px solid var(--border)" }}>
                <button className="secondary" onClick={runDebug} disabled={loading}>
                  {loading ? "Ejecutando..." : "Ejecutar nuevamente"}
                </button>
                <button className="secondary" onClick={onClose}>Cerrar</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const overlayStyle: React.CSSProperties = {
  position: "fixed",
  inset: 0,
  background: "rgba(0,0,0,0.7)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  zIndex: 1000,
};

const contentStyle: React.CSSProperties = {
  background: "var(--bg, #1a1a2e)",
  borderRadius: 12,
  maxWidth: 800,
  width: "90vw",
  maxHeight: "85vh",
  display: "flex",
  flexDirection: "column",
  boxShadow: "0 20px 60px rgba(0,0,0,0.5)",
};

const headerStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  padding: "20px 24px",
  borderBottom: "1px solid var(--border, #333)",
};

const closeBtnStyle: React.CSSProperties = {
  padding: "4px 8px",
  background: "none",
  border: "none",
  color: "var(--muted, #888)",
  fontSize: 20,
  cursor: "pointer",
};

const bodyStyle: React.CSSProperties = {
  overflowY: "auto",
  padding: 24,
  flex: 1,
};

const statsStyle: React.CSSProperties = {
  background: "var(--surface, #222)",
  borderRadius: 8,
  padding: 16,
  display: "flex",
  flexDirection: "column",
  gap: 6,
  fontSize: 13,
  border: "1px solid var(--border, #333)",
};

const productStyle: React.CSSProperties = {
  background: "var(--surface, #222)",
  border: "1px solid var(--border, #333)",
  borderRadius: 8,
  padding: 12,
};

const badgeOk: React.CSSProperties = {
  padding: "3px 8px",
  borderRadius: 3,
  fontSize: 11,
  fontWeight: 600,
  background: "rgba(34,197,94,0.15)",
  color: "rgb(34,197,94)",
  whiteSpace: "nowrap",
};

const badgeFail: React.CSSProperties = {
  padding: "3px 8px",
  borderRadius: 3,
  fontSize: 11,
  fontWeight: 600,
  background: "rgba(239,68,68,0.15)",
  color: "rgb(239,68,68)",
  whiteSpace: "nowrap",
};

const preStyle: React.CSSProperties = {
  margin: 0,
  fontSize: 11,
  color: "var(--muted, #888)",
  background: "var(--surface, #222)",
  padding: 8,
  borderRadius: 4,
  overflowX: "auto",
  maxHeight: 200,
  overflowY: "auto",
  whiteSpace: "pre-wrap",
  wordBreak: "break-word",
};
