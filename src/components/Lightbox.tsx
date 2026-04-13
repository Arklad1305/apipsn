import { useEffect } from "react";
import { createPortal } from "react-dom";

interface Props {
  images: string[];
  index: number;
  onChange: (i: number) => void;
  onClose: () => void;
}

export function Lightbox({ images, index, onChange, onClose }: Props) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      else if (e.key === "ArrowLeft")
        onChange((index - 1 + images.length) % images.length);
      else if (e.key === "ArrowRight") onChange((index + 1) % images.length);
    };
    document.addEventListener("keydown", onKey);
    // Lock body scroll while open.
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [index, images.length, onChange, onClose]);

  if (!images.length) return null;

  return createPortal(
    <div className="lightbox" onClick={onClose} role="dialog">
      <button
        className="lightbox-close"
        onClick={onClose}
        aria-label="Cerrar"
      >
        ✕
      </button>
      {images.length > 1 && (
        <>
          <button
            className="lightbox-nav lightbox-prev"
            onClick={(e) => {
              e.stopPropagation();
              onChange((index - 1 + images.length) % images.length);
            }}
            aria-label="Anterior"
          >
            ‹
          </button>
          <button
            className="lightbox-nav lightbox-next"
            onClick={(e) => {
              e.stopPropagation();
              onChange((index + 1) % images.length);
            }}
            aria-label="Siguiente"
          >
            ›
          </button>
        </>
      )}
      <img
        key={images[index]}
        src={images[index]}
        alt=""
        className="lightbox-img"
        onClick={(e) => e.stopPropagation()}
      />
      <span className="lightbox-counter">
        {index + 1} / {images.length}
      </span>
    </div>,
    document.body
  );
}
