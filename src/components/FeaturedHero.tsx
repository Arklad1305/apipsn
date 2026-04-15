import { useEffect, useRef, useState } from "react";
import type { CarouselItem } from "./CategoryCarousel";

interface Props {
  items: CarouselItem[];
  /** Milliseconds between automatic advances. Set to 0 to disable autoplay. */
  intervalMs?: number;
  onSelect?: (item: CarouselItem) => void;
}

// Cards march left → right. Spotlight sits at the right edge, and every card
// interpolates its size by distance to the spotlight — the closer to the end,
// the bigger. When a card reaches the spotlight it's at full size; one tick
// later it slides off to the right and re-enters small from the left.
const VISIBLE = 7;
const SPOTLIGHT_SLOT = VISIBLE - 1;
const MIN_W = 58;
const MIN_H = 78;
const MAX_W = 220;
const MAX_H = 280;
const GAP = 10;

function sizeForSlot(slot: number): { w: number; h: number } {
  const clamped = Math.max(0, Math.min(SPOTLIGHT_SLOT, slot));
  const t = clamped / SPOTLIGHT_SLOT; // 0..1
  const eased = Math.pow(t, 1.4); // gentle acceleration near the spotlight
  return {
    w: MIN_W + (MAX_W - MIN_W) * eased,
    h: MIN_H + (MAX_H - MIN_H) * eased,
  };
}

/** X coordinate of a slot's left edge, computed by summing the interpolated
 *  widths of every slot to its left (plus gaps). */
function slotX(slot: number): number {
  if (slot < 0) {
    return -sizeForSlot(0).w - GAP;
  }
  let x = 0;
  const upTo = Math.min(slot, SPOTLIGHT_SLOT + 1);
  for (let i = 0; i < upTo; i++) {
    x += sizeForSlot(i).w + GAP;
  }
  if (slot > SPOTLIGHT_SLOT) {
    // Past the spotlight: park off to the right so exit is a small slide.
    x += (slot - SPOTLIGHT_SLOT) * GAP;
  }
  return x;
}

function slotY(slot: number): number {
  return (MAX_H - sizeForSlot(slot).h) / 2;
}

function stripWidth(): number {
  let w = 0;
  for (let i = 0; i <= SPOTLIGHT_SLOT; i++) {
    w += sizeForSlot(i).w + (i < SPOTLIGHT_SLOT ? GAP : 0);
  }
  return w;
}

/** Full-bleed hero banner with an auto-advancing thumbnail strip. Cards
 *  enter small from the left, grow progressively as they slide right, and
 *  bloom to full size when they reach the spotlight at the far end. */
export function FeaturedHero({ items, intervalMs = 3200, onSelect }: Props) {
  const [start, setStart] = useState(0);
  const n = items.length;
  // Track each card's previous slot so we can disable the transform
  // transition for the one frame where it wraps (slot N-1 → slot 0), instead
  // of watching it streak across the whole strip.
  const prevSlotsRef = useRef<Record<string, number>>({});

  useEffect(() => {
    if (n <= 1 || intervalMs <= 0) return;
    // Decrement: cards visually slide right (toward the spotlight at the end).
    const id = setInterval(() => setStart((s) => (s - 1 + n) % n), intervalMs);
    return () => clearInterval(id);
  }, [n, intervalMs]);

  useEffect(() => {
    // After the frame paints, record current slots for the next wrap check.
    items.forEach((item, idx) => {
      prevSlotsRef.current[item.id] = (idx - start + n) % n;
    });
  }, [start, items, n]);

  if (n === 0) return null;

  const featuredIdx = (start + SPOTLIGHT_SLOT) % n;
  const featured = items[featuredIdx];
  const sw = stripWidth();

  return (
    <section
      className="hero-banner"
      aria-roledescription="hero"
      aria-label={`Destacado: ${featured.title}`}
    >
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
        <div className="hero-strip" style={{ width: sw, height: MAX_H }}>
          {items.map((item, idx) => {
            const slot = (idx - start + n) % n;
            const visible = slot <= SPOTLIGHT_SLOT;
            const spotlight = slot === SPOTLIGHT_SLOT;

            const prevSlot = prevSlotsRef.current[item.id];
            const wrapping =
              prevSlot !== undefined && Math.abs(slot - prevSlot) > 1;

            const sz = sizeForSlot(slot);
            const x = slotX(slot);
            const y = slotY(slot);

            // Brightness follows size so the climb toward spotlight lights up.
            const brightness = spotlight
              ? 1
              : 0.35 + (sz.w / MAX_W) * 0.6;

            return (
              <button
                key={item.id}
                type="button"
                className={spotlight ? "hero-thumb spotlight" : "hero-thumb"}
                style={{
                  width: sz.w,
                  height: sz.h,
                  transform: `translate(${x}px, ${y}px)`,
                  background: item.background,
                  opacity: visible ? 1 : 0,
                  pointerEvents: visible ? "auto" : "none",
                  filter: `brightness(${brightness})`,
                  zIndex: Math.round(sz.w),
                  // On wrap, skip the transform transition so the card
                  // teleports to slot 0 instead of streaking across.
                  transition: wrapping
                    ? "opacity 0.4s ease"
                    : "transform 0.7s cubic-bezier(0.22, 0.61, 0.36, 1), width 0.65s cubic-bezier(0.22, 0.61, 0.36, 1), height 0.65s cubic-bezier(0.22, 0.61, 0.36, 1), filter 0.55s ease, opacity 0.4s ease, box-shadow 0.4s ease",
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
