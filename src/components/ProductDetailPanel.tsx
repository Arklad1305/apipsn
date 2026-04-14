import { useEffect, useState } from "react";
import { getProductDetail, patchGame, refreshProductDetail } from "../api";
import type { GameOut, ProductDetail } from "../types";
import { Lightbox } from "./Lightbox";

interface Props {
  game: GameOut;
  onClose: () => void;
  onGameUpdated: (g: GameOut) => void;
}

/** Extract the 11-char video id from any common YouTube URL (watch, youtu.be,
 *  embed, shorts). Returns null when we can't recognize it. */
function parseYoutubeId(url: string): string | null {
  const s = url.trim();
  if (!s) return null;
  const m =
    /(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/|v\/))([A-Za-z0-9_-]{11})/.exec(
      s
    );
  return m ? m[1] : null;
}

const fmtCLP = (n: number | null) =>
  n == null ? "—" : "$" + Math.round(n).toLocaleString("es-CL");
const fmtUSD = (n: number | null) => (n == null ? "—" : "$" + n.toFixed(2));

export function ProductDetailPanel({ game, onClose, onGameUpdated }: Props) {
  const [detail, setDetail] = useState<ProductDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null);
  const [youtubeDraft, setYoutubeDraft] = useState(game.youtubeUrl || "");
  const [notesDraft, setNotesDraft] = useState(game.notes || "");
  const [savingYoutube, setSavingYoutube] = useState(false);
  const [savingNotes, setSavingNotes] = useState(false);

  // Re-sync local drafts when the selected game changes (or is updated from
  // elsewhere) so we don't overwrite an upstream change with a stale draft.
  useEffect(() => {
    setYoutubeDraft(game.youtubeUrl || "");
    setNotesDraft(game.notes || "");
  }, [game.id, game.youtubeUrl, game.notes]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    (async () => {
      try {
        let d = await getProductDetail(game.id);
        if (!d) d = await refreshProductDetail(game.id);
        if (!cancelled) setDetail(d);
      } catch (e) {
        if (!cancelled) setError((e as Error).message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [game.id]);

  const reload = async () => {
    setLoading(true);
    setError(null);
    try {
      const d = await refreshProductDetail(game.id);
      setDetail(d);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const saveYoutube = async () => {
    const trimmed = youtubeDraft.trim();
    if (trimmed === (game.youtubeUrl || "")) return;
    setSavingYoutube(true);
    try {
      const updated = await patchGame(game.id, { youtubeUrl: trimmed });
      onGameUpdated(updated);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSavingYoutube(false);
    }
  };

  const saveNotes = async () => {
    if (notesDraft === (game.notes || "")) return;
    setSavingNotes(true);
    try {
      const updated = await patchGame(game.id, { notes: notesDraft });
      onGameUpdated(updated);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSavingNotes(false);
    }
  };

  const hero = detail?.media.heroUrl || detail?.media.backgroundUrl || game.imageUrl;
  const psnVideo = detail?.media.videos[0] ?? null;
  const youtubeId = parseYoutubeId(game.youtubeUrl || "");
  const draftYoutubeId = parseYoutubeId(youtubeDraft);
  const youtubeInvalid =
    youtubeDraft.trim().length > 0 && draftYoutubeId == null;

  return (
    <section className="detail">
      <div className="detail-top">
        <button onClick={onClose} className="back" title="Volver al panel">
          <span aria-hidden="true">←</span> Volver al panel
        </button>
        <div className="detail-top-actions">
          <button onClick={reload} disabled={loading} title="Re-scrapear PSN">
            {loading ? "Actualizando…" : "Actualizar ficha"}
          </button>
          {game.storeUrl && (
            <a
              className="button"
              href={game.storeUrl}
              target="_blank"
              rel="noopener"
            >
              Abrir en PSN
            </a>
          )}
        </div>
      </div>

      <div className="detail-hero">
        {hero ? (
          <img src={hero} alt="" className="detail-hero-bg" />
        ) : (
          <div className="detail-hero-bg placeholder" />
        )}
        <div className="detail-hero-overlay">
          {detail?.media.logoUrl ? (
            <img
              src={detail.media.logoUrl}
              alt={game.name}
              className="detail-hero-logo"
            />
          ) : (
            <h2 className="detail-hero-title">{game.name}</h2>
          )}
          <div className="detail-hero-meta">
            <span>{game.platforms || "—"}</span>
            {detail?.ageRating && <span>· {detail.ageRating}</span>}
            {detail?.releaseDate && (
              <span>· {formatDate(detail.releaseDate)}</span>
            )}
            {detail?.fileSize && <span>· {detail.fileSize}</span>}
          </div>
        </div>
      </div>

      <div className="detail-grid">
        <div className="detail-main">
          {error && <div className="status err">{error}</div>}

          {loading && !detail && <div className="loading">Trayendo ficha…</div>}

          {(psnVideo || youtubeId) && (
            <>
              <h3 className="section-title">Video</h3>
              <div className="detail-video">
                {psnVideo ? (
                  <video
                    src={psnVideo.url}
                    poster={psnVideo.posterUrl ?? undefined}
                    controls
                    preload="metadata"
                  />
                ) : youtubeId ? (
                  <iframe
                    src={`https://www.youtube-nocookie.com/embed/${youtubeId}`}
                    title={`Video de ${game.name}`}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                ) : null}
              </div>
            </>
          )}

          {detail && (
            <>
              <h3 className="section-title">Descripción</h3>
              {detail.shortDescription && (
                <p className="detail-short">{detail.shortDescription}</p>
              )}
              <div
                className="detail-description"
                dangerouslySetInnerHTML={{ __html: detail.description }}
              />

              {detail.media.screenshots.length > 0 && (
                <>
                  <h3 className="section-title">Galería</h3>
                  <div className="gallery">
                    {detail.media.screenshots.map((url, i) => (
                      <button
                        key={url}
                        className="gallery-thumb"
                        onClick={() => setLightboxIdx(i)}
                        title="Ver en grande"
                      >
                        <img src={url} alt="" loading="lazy" />
                      </button>
                    ))}
                  </div>
                </>
              )}
            </>
          )}
        </div>

        <aside className="detail-side">
          <div className="detail-card">
            <h3 className="section-title">Precios</h3>
            <dl className="kv">
              <dt>PSN USD</dt>
              <dd>
                {game.priceOriginalUsd != null &&
                  game.priceOriginalUsd !== game.priceDiscountedUsd && (
                    <s className="muted">{fmtUSD(game.priceOriginalUsd)}</s>
                  )}{" "}
                <strong>{fmtUSD(game.priceDiscountedUsd)}</strong>{" "}
                {game.discountPercent > 0 && (
                  <span className="pill">-{game.discountPercent}%</span>
                )}
              </dd>
              <dt>Costo CLP</dt>
              <dd>{fmtCLP(game.costClp)}</dd>
              <dt>Primaria 1</dt>
              <dd className="price">{fmtCLP(game.primaria1)}</dd>
              <dt>Primaria 2</dt>
              <dd className="price">{fmtCLP(game.primaria2)}</dd>
              <dt>Secundaria</dt>
              <dd className="price">{fmtCLP(game.secundaria)}</dd>
              {game.marketMin != null && (
                <>
                  <dt>Mercado</dt>
                  <dd>
                    {fmtCLP(game.marketMin)}{" "}
                    <span className="muted">({game.marketCount})</span>
                  </dd>
                </>
              )}
            </dl>
          </div>

          {detail && (
            <div className="detail-card">
              <h3 className="section-title">Datos</h3>
              <dl className="kv">
                {detail.publisher && (
                  <>
                    <dt>Editor</dt>
                    <dd>{detail.publisher}</dd>
                  </>
                )}
                {detail.developer && (
                  <>
                    <dt>Desarrollo</dt>
                    <dd>{detail.developer}</dd>
                  </>
                )}
                {detail.genres.length > 0 && (
                  <>
                    <dt>Géneros</dt>
                    <dd>{detail.genres.join(", ")}</dd>
                  </>
                )}
                {detail.voiceLanguages.length > 0 && (
                  <>
                    <dt>Voces</dt>
                    <dd>{detail.voiceLanguages.join(", ")}</dd>
                  </>
                )}
                {detail.subtitleLanguages.length > 0 && (
                  <>
                    <dt>Subtítulos</dt>
                    <dd>{detail.subtitleLanguages.join(", ")}</dd>
                  </>
                )}
                <dt>Actualizado</dt>
                <dd className="muted">
                  {new Date(detail.fetchedAt).toLocaleString("es-CL")}
                </dd>
              </dl>
            </div>
          )}

          <div className="detail-card">
            <h3 className="section-title">Video de YouTube</h3>
            <p className="detail-hint muted">
              {psnVideo
                ? "PSN ya trae un tráiler; este link es un respaldo."
                : "Pegá el link del tráiler para mostrarlo en la ficha."}
            </p>
            <div className="detail-edit">
              <input
                type="url"
                placeholder="https://www.youtube.com/watch?v=…"
                value={youtubeDraft}
                onChange={(e) => setYoutubeDraft(e.target.value)}
                onBlur={saveYoutube}
                onKeyDown={(e) => {
                  if (e.key === "Enter") (e.target as HTMLInputElement).blur();
                }}
              />
              {youtubeInvalid && (
                <span className="detail-edit-err">
                  No reconozco este link de YouTube.
                </span>
              )}
              {savingYoutube && (
                <span className="muted detail-edit-hint">Guardando…</span>
              )}
            </div>
          </div>

          <div className="detail-card">
            <h3 className="section-title">Notas</h3>
            <div className="detail-edit">
              <textarea
                rows={3}
                placeholder="Notas internas, idiomas, avisos…"
                value={notesDraft}
                onChange={(e) => setNotesDraft(e.target.value)}
                onBlur={saveNotes}
              />
              {savingNotes && (
                <span className="muted detail-edit-hint">Guardando…</span>
              )}
            </div>
          </div>
        </aside>
      </div>

      {lightboxIdx != null && detail && (
        <Lightbox
          images={detail.media.screenshots}
          index={lightboxIdx}
          onChange={setLightboxIdx}
          onClose={() => setLightboxIdx(null)}
        />
      )}
    </section>
  );
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("es-CL", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}
