import { useState } from "react";
import {
  cardStyle,
  EFFECT_CONFIG,
  EFFECT_LABELS,
  type CarouselEffect,
} from "./carouselEffects";

export interface CarouselItem {
  id: string;
  title: string;
  subtitle: string;
  /** CSS background (gradient or url(...)). */
  background: string;
}

interface Props {
  items: CarouselItem[];
  onSelect?: (item: CarouselItem) => void;
  heading?: string;
  /** Visual effect. Defaults to coverflow. */
  effect?: CarouselEffect;
  /** Render the effect switcher chips. */
  showEffectSwitcher?: boolean;
}

/** 3D carousel with pluggable effects (coverflow / cylinder / stack). */
export function CategoryCarousel({
  items,
  onSelect,
  heading,
  effect: effectProp = "coverflow",
  showEffectSwitcher = false,
}: Props) {
  const [active, setActive] = useState(Math.floor(items.length / 2));
  const [effect, setEffect] = useState<CarouselEffect>(effectProp);
  const cfg = EFFECT_CONFIG[effect];
  const n = items.length;
  const prev = () => setActive((i) => (i - 1 + n) % n);
  const next = () => setActive((i) => (i + 1) % n);

  return (
    <section className="coverflow-wrap">
      {(heading || showEffectSwitcher) && (
        <header className="coverflow-head">
          {heading && <h3 className="coverflow-heading">{heading}</h3>}
          {showEffectSwitcher && (
            <div className="coverflow-effects" role="tablist">
              {(Object.keys(EFFECT_LABELS) as CarouselEffect[]).map((e) => (
                <button
                  key={e}
                  type="button"
                  role="tab"
                  aria-selected={effect === e}
                  className={effect === e ? "chip active" : "chip"}
                  onClick={() => setEffect(e)}
                >
                  {EFFECT_LABELS[e]}
                </button>
              ))}
            </div>
          )}
        </header>
      )}

      <div
        className={`coverflow coverflow-${effect}`}
        style={
          {
            height: cfg.height,
            perspective: `${cfg.perspective}px`,
          } as React.CSSProperties
        }
        role="region"
        aria-label={heading || "carrusel"}
      >
        <button
          type="button"
          className="coverflow-nav coverflow-prev"
          onClick={prev}
          aria-label="Anterior"
        >
          ‹
        </button>

        <div className="coverflow-track">
          {items.map((it, i) => {
            // Shortest signed distance from active, for clean looping.
            let offset = i - active;
            if (offset > n / 2) offset -= n;
            if (offset < -n / 2) offset += n;
            const abs = Math.abs(offset);
            const hidden = abs > cfg.visibleRadius;

            const style: React.CSSProperties = {
              width: cfg.cardWidth,
              height: cfg.cardHeight,
              marginLeft: -cfg.cardWidth / 2,
              marginTop: -cfg.cardHeight / 2,
              background: it.background,
              opacity: hidden ? 0 : 1,
              pointerEvents: hidden ? "none" : "auto",
              zIndex: cfg.reverseZOrder ? n - abs : n + (offset < 0 ? -5 : -offset),
              ...cardStyle(effect, offset),
            };

            return (
              <button
                key={it.id}
                type="button"
                className={offset === 0 ? "coverflow-card active" : "coverflow-card"}
                style={style}
                onClick={() => (offset === 0 ? onSelect?.(it) : setActive(i))}
                aria-label={it.title}
                tabIndex={abs > 1 ? -1 : 0}
              >
                <div className="coverflow-overlay">
                  <div className="coverflow-caption">
                    <div className="coverflow-subtitle">{it.subtitle}</div>
                    <div className="coverflow-title">{it.title}</div>
                  </div>
                  <span className="coverflow-cta">Ver más</span>
                </div>
              </button>
            );
          })}
        </div>

        <button
          type="button"
          className="coverflow-nav coverflow-next"
          onClick={next}
          aria-label="Siguiente"
        >
          ›
        </button>
      </div>

      <div className="coverflow-dots" role="tablist">
        {items.map((it, i) => (
          <button
            key={it.id}
            type="button"
            role="tab"
            aria-selected={i === active}
            className={i === active ? "coverflow-dot active" : "coverflow-dot"}
            onClick={() => setActive(i)}
            aria-label={`Ir a ${it.title}`}
          />
        ))}
      </div>
    </section>
  );
}
