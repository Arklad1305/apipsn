import type { Platform, ProviderSource, SourceResult } from "../types";
import { PLATFORM_LABELS } from "../types";

interface SourceStatusPanelProps {
  sources: ProviderSource[];
  lastResults: SourceResult[] | null;
  onRefreshSource: (platform: Platform, region: string) => void;
  refreshing: boolean;
}

const REGION_LABELS: Record<string, string> = {
  us: "US",
  br: "Brasil",
  tr: "Turquía",
  jp: "Japón",
};

export function SourceStatusPanel({
  sources,
  lastResults,
  onRefreshSource,
  refreshing,
}: SourceStatusPanelProps) {
  const resultMap = new Map<string, SourceResult>();
  for (const r of lastResults ?? []) {
    resultMap.set(`${r.platform}:${r.region}`, r);
  }

  return (
    <div className="source-status-panel">
      {sources.map((src) => {
        const key = `${src.platform}:${src.region}`;
        const result = resultMap.get(key);
        const hasResult = result != null;
        const hasError = hasResult && !!result.error;
        const isOk = hasResult && !hasError && result.totalSeen > 0;

        let dotClass = "disabled";
        if (!src.enabled) dotClass = "disabled";
        else if (hasError) dotClass = "error";
        else if (isOk) dotClass = "ok";
        else if (hasResult) dotClass = "warn";

        let detail = "";
        if (!src.enabled) detail = "deshabilitado";
        else if (hasError) detail = result.error!.slice(0, 90);
        else if (isOk) detail = `${result.totalSeen} juegos`;
        else if (hasResult) detail = "0 resultados";
        else detail = "sin datos";

        const platformLabel = PLATFORM_LABELS[src.platform] ?? src.platform;
        const regionLabel = REGION_LABELS[src.region] ?? src.region.toUpperCase();

        return (
          <div key={key} className={`source-status-card${!src.enabled ? " source-status-disabled" : ""}`}>
            <span className={`source-status-dot ${dotClass}`} title={dotClass} />
            <div className="source-status-info">
              <div className="source-status-name">
                {platformLabel} <span className="source-status-region">{regionLabel}</span>
              </div>
              <div className="source-status-detail" title={hasError ? result?.error : undefined}>
                {detail}
              </div>
            </div>
            {src.enabled && (
              <button
                className="source-status-btn"
                onClick={() => onRefreshSource(src.platform, src.region)}
                disabled={refreshing}
                title={`Refrescar ${platformLabel} ${regionLabel}`}
              >
                ↻
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}
