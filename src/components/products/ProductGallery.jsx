import { useCallback, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

import ProductMedia from "./ProductMedia.jsx";

/**
 * Swipeable product image gallery.
 *
 * Native scroll-snap handles touch swiping and momentum, so there is no
 * carousel dependency. Dots show position and are tappable; arrows appear for
 * pointer users. Arrow keys work when the gallery has focus.
 */
export default function ProductGallery({ product, images }) {
  const trackRef = useRef(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const count = images.length;

  const goTo = useCallback(
    (index) => {
      const track = trackRef.current;
      const next = Math.min(Math.max(index, 0), count - 1);

      if (track) {
        track.scrollTo({ left: next * track.clientWidth, behavior: "smooth" });
      }

      setActiveIndex(next);
    },
    [count]
  );

  const handleScroll = () => {
    const track = trackRef.current;

    if (track && track.clientWidth) {
      setActiveIndex(Math.round(track.scrollLeft / track.clientWidth));
    }
  };

  const handleKeyDown = (event) => {
    if (event.key === "ArrowRight") {
      event.preventDefault();
      goTo(activeIndex + 1);
    }

    if (event.key === "ArrowLeft") {
      event.preventDefault();
      goTo(activeIndex - 1);
    }
  };

  return (
    <div className="omasta-gallery" aria-roledescription="carousel" aria-label={`${product.name} images`}>
      <div
        className="omasta-gallery-track"
        ref={trackRef}
        onScroll={handleScroll}
        onKeyDown={handleKeyDown}
        tabIndex={0}
        aria-live="polite"
      >
        {images.map((image, index) => (
          <div
            className={`omasta-product-detail-art omasta-gallery-slide omasta-gallery-slide--${image.view || "front"}`}
            key={image.id || index}
            role="group"
            aria-roledescription="slide"
            aria-label={`${index + 1} of ${count}: ${image.label || product.name}`}
          >
            <ProductMedia image={image} product={product} size="large" />
          </div>
        ))}
      </div>

      {product.badge ? <span className="orange-product-badge omasta-gallery-badge">{product.badge}</span> : null}

      {count > 1 ? (
        <>
          <button
            type="button"
            className="omasta-gallery-arrow omasta-gallery-arrow--prev"
            onClick={() => goTo(activeIndex - 1)}
            disabled={activeIndex === 0}
            aria-label="Previous image"
          >
            <ChevronLeft size={18} />
          </button>
          <button
            type="button"
            className="omasta-gallery-arrow omasta-gallery-arrow--next"
            onClick={() => goTo(activeIndex + 1)}
            disabled={activeIndex >= count - 1}
            aria-label="Next image"
          >
            <ChevronRight size={18} />
          </button>

          <div className="omasta-gallery-dots">
            {images.map((image, index) => (
              <button
                type="button"
                key={image.id || index}
                className={index === activeIndex ? "is-active" : ""}
                onClick={() => goTo(index)}
                aria-label={`Show image ${index + 1} of ${count}`}
                aria-current={index === activeIndex ? "true" : undefined}
              />
            ))}
          </div>
        </>
      ) : null}
    </div>
  );
}
