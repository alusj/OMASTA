import ProductArt from "./ProductArt.jsx";

/**
 * Renders one product image: a real photo when the entry has `src`, otherwise
 * the illustrated device motif for that view. Cards and the gallery both use
 * this, so switching the catalogue to real photography needs no UI changes.
 */
export default function ProductMedia({ image, product, size = "default" }) {
  if (image?.src) {
    return (
      <img
        className="omasta-product-media-img"
        src={image.src}
        alt={image.label ? `${product.name}, ${image.label}` : product.name}
        loading="lazy"
        decoding="async"
      />
    );
  }

  return <ProductArt art={image?.art || product.art} view={image?.view || "front"} size={size} />;
}
