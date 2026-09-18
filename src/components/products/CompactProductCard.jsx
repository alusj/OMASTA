import { Link } from "react-router-dom";
import { ArrowUpRight } from "lucide-react";

import ProductMedia from "./ProductMedia.jsx";
import { getProductImages } from "../../services/catalog/catalogService.js";

/**
 * Small product tile for Home rails. The whole card opens product details;
 * buying happens there, behind its own confirmation step.
 */
export default function CompactProductCard({ product }) {
  const [cover] = getProductImages(product);

  return (
    <Link className="omasta-mini-product" to={`/shop/${product.id}`} aria-label={`${product.name}, ${product.price}`}>
      <span className="omasta-mini-product-media">
        <ProductMedia image={cover} product={product} size="small" />
        {product.badge ? <span className="omasta-mini-badge">{product.badge}</span> : null}
      </span>
      <span className="omasta-mini-product-body">
        <strong>{product.name}</strong>
        <span className="omasta-mini-product-price">
          {product.price}
          <ArrowUpRight size={15} aria-hidden="true" />
        </span>
      </span>
    </Link>
  );
}
