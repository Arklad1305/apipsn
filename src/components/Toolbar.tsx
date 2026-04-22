interface Props {
  onRefresh: () => void;
  onRefreshCompetitors: () => void;
  onClear: () => void;
  onEnrich?: () => void;
  exportHref: string;
  exportJsonHref?: string;
  exportSupabaseHref?: string;
  variant: "offers" | "watchlist" | "settings";
}

export function Toolbar({
  onRefresh,
  onRefreshCompetitors,
  onClear,
  onEnrich,
  exportHref,
  exportJsonHref,
  exportSupabaseHref,
  variant,
}: Props) {
  if (variant === "settings") return null;
  return (
    <div className="toolbar">
      <button className="primary" onClick={onRefresh}>
        Actualizar ofertas
      </button>
      {variant === "offers" && (
        <button
          onClick={onRefreshCompetitors}
          title="Scrapea tiendas de la competencia y calcula matches"
        >
          Actualizar competencia
        </button>
      )}
      {variant === "offers" && onEnrich && (
        <button
          onClick={onEnrich}
          title="Scrapea detalles del producto (ESRB, jugadores, imágenes) para juegos seleccionados"
        >
          Enriquecer datos
        </button>
      )}
      <a className="button" href={exportHref} target="_blank" rel="noopener">
        CSV
      </a>
      {variant === "offers" && exportJsonHref && (
        <a className="button" href={exportJsonHref} target="_blank" rel="noopener" title="JSON con datos enriquecidos">
          JSON
        </a>
      )}
      {variant === "offers" && exportSupabaseHref && (
        <a className="button" href={exportSupabaseHref} target="_blank" rel="noopener" title="JSON listo para INSERT en Supabase">
          Supabase
        </a>
      )}
      {variant === "offers" && (
        <button className="danger" onClick={onClear} title="Desactivar todos los juegos">
          Vaciar
        </button>
      )}
    </div>
  );
}
