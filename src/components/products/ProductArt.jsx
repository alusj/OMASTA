import { CreditCard, Router, Signal, Smartphone, Wifi } from "lucide-react";

/**
 * Lightweight illustrated artwork for a product.
 *
 * The catalogue has no image URLs yet, so rather than shipping placeholder
 * photography this draws a consistent device motif from the existing Orange
 * styling. When real product imagery arrives, render an <img> here and the rest
 * of the card layout is unchanged.
 */

const ICONS = {
  router: Router,
  mifi: Wifi,
  phone: Smartphone,
  sim: CreditCard,
  accessory: Signal,
};

/**
 * `view` gives galleries distinct slides from the same motif:
 * "front" (default), "angle", "detail" (close-up) and "box" (packaging).
 */
export default function ProductArt({ art = "router", size = "default", view = "front" }) {
  const Icon = ICONS[art] || Wifi;

  return (
    <div
      className={`orange-product-art orange-product-art--${art} orange-product-art--${size} orange-product-art--view-${view}`}
      aria-hidden="true"
    >
      <div className="orange-product-glow" />
      {view === "box" ? <span className="orange-product-box" /> : null}
      <div className="orange-product-device">
        <div className="orange-product-device-screen">
          <Icon size={26} strokeWidth={1.8} />
        </div>
        <span className="orange-product-device-light" />
        <span className="orange-product-device-line" />
      </div>
      <span className="orange-product-orbit orange-product-orbit--one" />
      <span className="orange-product-orbit orange-product-orbit--two" />
    </div>
  );
}
