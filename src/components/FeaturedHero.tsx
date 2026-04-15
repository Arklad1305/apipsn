import { useEffect, useState } from "react";
import type { CarouselItem } from "./CategoryCarousel";

interface Props {
  items: CarouselItem[];
  /** Milliseconds between automatic advances. Set to 0 to disable autoplay. */
  intervalMs?: number;
  onSelect?: (item: CarouselItem) => void;
}

const VISIBLE = 7;
const SPOTLIGHT_SLOT = 3;
const SMALL_W = 96;
const SMALL_H = 128;
const BIG_W = 188;
const BIG_H = 238;
const GAP = 12;

/** Full-bleed hero banner with an auto-advancing thumbnail strip at the
 *  bottom. The whole background, title and copy swap to whichever item
 *  currently owns the spotlight slot; crossfade is handled by stacking one
 *  background layer per item and toggling opacity. */
export function FeaturedHero({ items, intervalMs = 4500, onSelect }: Props) {
  const [start, setStart] = useState(0);
  const n = items.length;

  useEffect(() => {
    if (n <= 1 || intervalMs <= 0) return;
    const id = setInterval(() => setStart((s) => (s + 1) % n), intervalMs);
    return () => clearInterval(id);
  }, [n, intervalMs]);

  if (n === 0) return null;

  const slotX = (slot: number): number => {
    let x = 0;
    for (let i = 0; i < slot; i++) {
      x += (i === SPOTLIGHT_SLOT ? BIG_W : SMALL_W) + GAP;
    }
    return x;
  };
  const slotY = (slot: number): number =>
    slot === SPOTLIGHT_SLOT ? 0 : (BIG_H - SMALL_H) / 2;

  const totalWidth = slotX(VISIBLE);
  const featuredIdx = (start + SPOTLIGHT_SLOT) % n;
  const featured = items[featuredIdx];

  return (
    <section
      className="hero-banner"
      aria-roledescription="hero"
      aria-label={`Destacado: ${featured.title}`}
    >
      {/* One persistent background layer per item; only the featured one is
          opaque. Lets the browser crossfade between gradients for free. */}
      {items.map((item) => (
        <div
          key={`bg-${item.id}`}
          className="hero-bg"
          style={{
            background: item.background,
            opacity: item.id === featured.id ? 1 : 0,
          }}
        />
      ))}
      <div className="hero-scrim" />

      <div className="hero-content">
        <span className="hero-eyebrow">★ Destacado de la semana</span>
        <h1 className="hero-title" key={`t-${featured.id}`}>
          {featured.title}
        </h1>
        <p className="hero-subtitle" key={`s-${featured.id}`}>
          {featured.subtitle}
        </p>
        <div className="hero-actions">
          <button
            type="button"
            className="primary hero-cta"
            onClick={() => onSelect?.(featured)}
          >
            Ver oferta
          </button>
          <span className="hero-counter">
            {featuredIdx + 1} <span className="muted">/ {n}</span>
          </span>
        </div>
      </div>

      <div className="hero-strip-container">
        <div
          className="hero-strip"
          style={{ width: totalWidth, height: BIG_H }}
        >
          {items.map((item, idx) => {
            const slot = (idx - start + n) % n;
            const visible = slot < VISIBLE;
            const spotlight = slot === SPOTLIGHT_SLOT;
            let x: number;
            let y: number;
            if (visible) {
              x = slotX(slot);
              y = slotY(slot);
            } else if (slot === n - 1) {
              // Just left: park off the left edge so it slides out instead
              // of teleporting to the queue.
              x = -SMALL_W - GAP;
              y = (BIG_H - SMALL_H) / 2;
            } else {
              x = totalWidth + GAP;
              y = (BIG_H - SMALL_H) / 2;
            }

            return (
              <button
                key={item.id}
                type="button"
                className={spotlight ? "hero-thumb spotlight" : "hero-thumb"}
                style={{
                  width: spotlight ? BIG_W : SMALL_W,
                  height: spotlight ? BIG_H : SMALL_H,
                  transform: `translate(${x}px, ${y}px)`,
                  background: item.background,
                  opacity: visible ? 1 : 0,
                  pointerEvents: visible ? "auto" : "none",
                  zIndex: spotlight ? 10 : 1,
                }}
                onClick={() => {
                  if (spotlight) onSelect?.(item);
                  else setStart((idx - SPOTLIGHT_SLOT + n) % n);
                }}
                aria-label={item.title}
                tabIndex={visible ? 0 : -1}
              >
                <div className="hero-thumb-overlay">
                  {spotlight && (
                    <span className="hero-thumb-eyebrow">{item.subtitle}</span>
                  )}
                  <span className="hero-thumb-title">{item.title}</span>
                </div>
              </button>
            );
          })}
        </div>

        <div className="hero-progress" role="tablist" aria-label="Posición">
          {items.map((it, i) => (
            <button
              key={it.id}
              type="button"
              role="tab"
              aria-selected={i === featuredIdx}
              className={
                i === featuredIdx
                  ? "hero-progress-dot active"
                  : "hero-progress-dot"
              }
              onClick={() => setStart((i - SPOTLIGHT_SLOT + n) % n)}
              aria-label={`Ir a ${it.title}`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
