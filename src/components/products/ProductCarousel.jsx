import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

import ProductCard from "./ProductCard.jsx";

/**
 * Featured products carousel.
 *
 * Native scroll-snap does the work on touch devices, so there is no carousel
 * dependency. The arrows are for pointer users and are hidden on small screens.
 */
export default function ProductCarousel({ products, onView, onBuy, label = "Featured products" }) {
  const trackRef = useRef(null);
  const [activeIndex, setActiveIndex] = useState(0);

  const scrollToIndex = useCallback((index) => {
    const track = trackRef.current;

    if (!track) {
      return;
    }

    const slide = track.children[index];

    if (slide) {
      track.scrollTo({ left: slide.offsetLeft - track.offsetLeft, behavior: "smooth" });
    }
  }, []);

  useEffect(() => {
    const track = trackRef.current;

    if (!track) {
      return undefined;
    }

    const onScroll = () => {
      const slideWidth = track.children[0]?.offsetWidth || 1;
      const gap = 14;
      setActiveIndex(Math.round(track.scrollLeft / (slideWidth + gap)));
    };

    track.addEventListener("scroll", onScroll, { passive: true });
    return () => track.removeEventListener("scroll", onScroll);
  }, [products.length]);

  const step = (direction) => {
    const next = Math.min(Math.max(activeIndex + direction, 0), products.length - 1);
    setActiveIndex(next);
    scrollToIndex(next);
  };

  return (
    <div className="omasta-carousel" aria-roledescription="carousel" aria-label={label}>
      <div className="omasta-carousel-track" ref={trackRef}>
        {products.map((product) => (
          <div className="omasta-carousel-slide" key={product.id}>
            <ProductCard product={product} variant="carousel" onView={onView} onBuy={onBuy} />
          </div>
        ))}
      </div>

      <div className="omasta-carousel-controls">
        <button type="button" aria-label="Previous product" onClick={() => step(-1)} disabled={activeIndex === 0}>
          <ChevronLeft size={17} />
        </button>
        <div className="orange-product-dots" aria-hidden="true">
          {products.map((product, index) => (
            <button
              type="button"
              key={product.id}
              className={index === activeIndex ? "is-active" : ""}
              tabIndex={-1}
              aria-label={`Show ${product.name}`}
              onClick={() => {
                setActiveIndex(index);
                scrollToIndex(index);
              }}
            />
          ))}
        </div>
        <button
          type="button"
          aria-label="Next product"
          onClick={() => step(1)}
          disabled={activeIndex >= products.length - 1}
        >
          <ChevronRight size={17} />
        </button>
      </div>
    </div>
  );
}
