import { ArrowRight } from "lucide-react";

import DemoBadge from "../common/DemoBadge.jsx";
import ProductArt from "./ProductArt.jsx";

/**
 * Reusable product card. `variant` controls density:
 *  - "grid"     shop listing
 *  - "carousel" home carousel slide
 */
export default function ProductCard({ product, variant = "grid", onView, onBuy }) {
  return (
    <article className={`omasta-product-card omasta-product-card--${variant}`}>
      <div className="omasta-product-card-art">
        <ProductArt art={product.art} />
        {product.badge ? <span className="orange-product-badge">{product.badge}</span> : null}
      </div>

      <div className="omasta-product-card-body">
        <p className="orange-product-category">{product.category}</p>
        <h3>{product.name}</h3>
        <p className="omasta-product-card-copy">{product.tagline}</p>

        <div className="omasta-product-card-price">
          <div>
            <span>From</span>
            <strong>{product.price}</strong>
          </div>
          {product.isDemo ? <DemoBadge label="Demo price" /> : null}
        </div>

        <div className="omasta-product-card-actions">
          <button type="button" className="orange-button orange-button--outline" onClick={() => onView?.(product)}>
            View details
            <ArrowRight size={15} />
          </button>
          <button type="button" className="orange-button orange-button--solid" onClick={() => onBuy?.(product)}>
            Buy
          </button>
        </div>
      </div>
    </article>
  );
}
