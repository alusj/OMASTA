import { useEffect, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { ArrowLeft, Check, MapPin, Sparkles } from "lucide-react";

import BottomSheet from "../components/common/BottomSheet.jsx";
import DemoBadge, { DemoNote } from "../components/common/DemoBadge.jsx";
import ProductArt from "../components/products/ProductArt.jsx";
import { SkeletonList } from "../components/common/Skeleton.jsx";
import { getProduct } from "../services/catalog/catalogService.js";
import { useAppUi } from "../context/AppUiProvider.jsx";
import { useAssistant } from "../context/AssistantProvider.jsx";
import { useAssistantScreenContext } from "../hooks/useAssistantScreenContext.js";

/** Full product detail, reachable from the shop, search or the assistant. */
export default function ProductDetailScreen() {
  const { productId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { showNotice } = useAppUi();
  const { openAssistant } = useAssistant();

  const [product, setProduct] = useState(null);
  const [notFound, setNotFound] = useState(false);
  const [buyOpen, setBuyOpen] = useState(false);

  useAssistantScreenContext({ screen: "product", focus: { productId } }, [productId]);

  useEffect(() => {
    let active = true;
    setProduct(null);
    setNotFound(false);

    getProduct(productId).then((result) => {
      if (!active) {
        return;
      }

      if (result) {
        setProduct(result);
      } else {
        setNotFound(true);
      }
    });

    return () => {
      active = false;
    };
  }, [productId]);

  useEffect(() => {
    if (product && searchParams.get("intent") === "buy") {
      setBuyOpen(true);
    }
  }, [product, searchParams]);

  if (notFound) {
    return (
      <section className="orange-page-section">
        <div className="orange-page-intro">
          <h1>Product not found</h1>
          <p>That product is not in the catalogue.</p>
        </div>
        <Link className="orange-button orange-button--solid" to="/shop">
          Back to the shop
        </Link>
      </section>
    );
  }

  if (!product) {
    return (
      <section className="orange-page-section">
        <SkeletonList count={2} />
      </section>
    );
  }

  return (
    <section className="orange-page-section" aria-labelledby="product-title">
      <button type="button" className="omasta-back-button" onClick={() => navigate(-1)}>
        <ArrowLeft size={16} />
        Back
      </button>

      <article className="omasta-product-detail">
        <div className="omasta-product-detail-art">
          <ProductArt art={product.art} size="large" />
          {product.badge ? <span className="orange-product-badge">{product.badge}</span> : null}
        </div>

        <div className="omasta-product-detail-copy">
          <p className="orange-product-category">{product.category}</p>
          <h1 id="product-title">{product.name}</h1>
          <p className="omasta-product-detail-tagline">{product.tagline}</p>
          <p>{product.description}</p>

          <div className="omasta-product-detail-price">
            <div>
              <span>From</span>
              <strong>{product.price}</strong>
              <small>{product.note}</small>
            </div>
            {product.isDemo ? <DemoBadge label="Demo price" /> : null}
          </div>

          <div className="omasta-product-detail-actions">
            <button type="button" className="orange-button orange-button--solid" onClick={() => setBuyOpen(true)}>
              Buy
            </button>
            <button
              type="button"
              className="orange-button orange-button--outline"
              onClick={() => navigate("/find?category=shop&view=map")}
            >
              <MapPin size={15} />
              Find a shop
            </button>
            <button
              type="button"
              className="omasta-ask-ai-button"
              onClick={() => openAssistant({ prompt: `Tell me about the ${product.name}` })}
            >
              <Sparkles size={15} />
              Ask OMASTA AI
            </button>
          </div>
        </div>
      </article>

      <div className="omasta-product-detail-panels">
        <div className="omasta-detail-panel">
          <h2>Highlights</h2>
          <ul className="omasta-detail-list">
            {product.highlights.map((item) => (
              <li key={item}>
                <Check size={15} />
                {item}
              </li>
            ))}
          </ul>
        </div>

        <div className="omasta-detail-panel">
          <h2>Specifications</h2>
          <dl className="omasta-spec-list">
            {product.specs.map((spec) => (
              <div key={spec.label}>
                <dt>{spec.label}</dt>
                <dd>{spec.value}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>

      <DemoNote>
        This product record is sample data. Availability, specifications and pricing must come from an Orange catalogue
        API before they can be relied on.
      </DemoNote>

      <BottomSheet
        open={buyOpen}
        onClose={() => setBuyOpen(false)}
        eyebrow="Confirm before continuing"
        title={`Buy the ${product.name}?`}
        labelledById="buy-product-title"
      >
        <div className="omasta-confirm">
          <p>
            {product.name} · {product.price}
          </p>
          <DemoNote>
            Checkout and payment are not connected in this build. Nothing will be ordered or charged. An Orange shop can
            complete a purchase today.
          </DemoNote>
          <div className="omasta-confirm-actions">
            <button
              type="button"
              className="orange-button orange-button--solid"
              onClick={() => {
                setBuyOpen(false);
                navigate("/find?category=shop&view=map");
              }}
            >
              Find a shop that sells it
            </button>
            <button
              type="button"
              className="orange-button orange-button--outline"
              onClick={() => {
                setBuyOpen(false);
                showNotice("Nothing was ordered. Online checkout needs an Orange commerce API.");
              }}
            >
              Not now
            </button>
          </div>
        </div>
      </BottomSheet>
    </section>
  );
}
