interface Props {
  page: number;
  totalPages: number;
  pageSize: number;
  total: number;
  onChange: (p: number) => void;
}

/** Condensed pagination: first / prev / [...windowed pages...] / next / last.
 *  Keeps up to 7 visible number buttons — enough for 1200 games at 30/page. */
export function Pagination({ page, totalPages, pageSize, total, onChange }: Props) {
  if (total === 0) return null;
  const first = (page - 1) * pageSize + 1;
  const last = Math.min(page * pageSize, total);

  const go = (p: number) => {
    const clamped = Math.max(1, Math.min(totalPages, p));
    if (clamped !== page) onChange(clamped);
  };

  return (
    <nav className="pagination" aria-label="Paginación">
      <span className="pagination-range">
        {first.toLocaleString("es-CL")}–{last.toLocaleString("es-CL")} de{" "}
        {total.toLocaleString("es-CL")}
      </span>
      <div className="pagination-controls">
        <button
          onClick={() => go(1)}
          disabled={page <= 1}
          title="Primera página"
          aria-label="Primera"
        >
          «
        </button>
        <button
          onClick={() => go(page - 1)}
          disabled={page <= 1}
          title="Anterior"
          aria-label="Anterior"
        >
          ‹
        </button>
        {pageNumbers(page, totalPages).map((n, i) =>
          n === "…" ? (
            <span key={`gap-${i}`} className="pagination-gap">
              …
            </span>
          ) : (
            <button
              key={n}
              onClick={() => go(n)}
              className={n === page ? "pagination-current" : ""}
              aria-current={n === page ? "page" : undefined}
            >
              {n}
            </button>
          )
        )}
        <button
          onClick={() => go(page + 1)}
          disabled={page >= totalPages}
          title="Siguiente"
          aria-label="Siguiente"
        >
          ›
        </button>
        <button
          onClick={() => go(totalPages)}
          disabled={page >= totalPages}
          title="Última página"
          aria-label="Última"
        >
          »
        </button>
      </div>
    </nav>
  );
}

function pageNumbers(page: number, total: number): (number | "…")[] {
  if (total <= 7) return range(1, total);
  const out: (number | "…")[] = [1];
  const start = Math.max(2, page - 1);
  const end = Math.min(total - 1, page + 1);
  if (start > 2) out.push("…");
  for (let i = start; i <= end; i++) out.push(i);
  if (end < total - 1) out.push("…");
  out.push(total);
  return out;
}

function range(a: number, b: number): number[] {
  const out: number[] = [];
  for (let i = a; i <= b; i++) out.push(i);
  return out;
}
