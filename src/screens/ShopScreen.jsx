import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Check, Sparkles } from "lucide-react";

import BottomSheet from "../components/common/BottomSheet.jsx";
import DemoBadge, { DemoNote } from "../components/common/DemoBadge.jsx";
import FilterChips from "../components/common/FilterChips.jsx";
import ProductCard from "../components/products/ProductCard.jsx";
import { SkeletonList } from "../components/common/Skeleton.jsx";
import {
  findBundleSync,
  getBundleTypes,
  getProductCategories,
  listBundles,
  listProducts,
} from "../services/catalog/catalogService.js";
import { useAppUi } from "../context/AppUiProvider.jsx";
import { useAssistant } from "../context/AssistantProvider.jsx";
import { useAssistantScreenContext } from "../hooks/useAssistantScreenContext.js";

const TABS = [
  { id: "devices", label: "Devices" },
  { id: "bundles", label: "Bundles" },
];

/** Shop: devices from the catalogue and the bundle comparison. */
export default function ShopScreen() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { showNotice } = useAppUi();
  const { openAssistant } = useAssistant();

  const tab = searchParams.get("tab") === "bundles" ? "bundles" : "devices";
  const categoryId = searchParams.get("category") || "all";
  const bundleTypeId = searchParams.get("type") || "all";
  const highlightedBundleId = searchParams.get("bundle");

  const [products, setProducts] = useState(null);
  const [bundles, setBundles] = useState(null);
  const [pendingBundle, setPendingBundle] = useState(null);

  useAssistantScreenContext(
    { screen: tab === "bundles" ? "bundles" : "shop", focus: { category: categoryId } },
    [tab, categoryId]
  );

  useEffect(() => {
    let active = true;
    setProducts(null);

    listProducts({ categoryId }).then((result) => {
      if (active) {
        setProducts(result);
      }
    });

    return () => {
      active = false;
    };
  }, [categoryId]);

  useEffect(() => {
    let active = true;
    setBundles(null);

    listBundles({ typeId: bundleTypeId }).then((result) => {
      if (active) {
        setBundles(result);
      }
    });

    return () => {
      active = false;
    };
  }, [bundleTypeId]);

  // An assistant deep link can arrive with an activation intent attached.
  useEffect(() => {
    if (highlightedBundleId && searchParams.get("intent") === "activate") {
      const bundle = findBundleSync(highlightedBundleId);

      if (bundle) {
        setPendingBundle(bundle);
      }
    }
  }, [highlightedBundleId, searchParams]);

  const updateParams = (changes) => {
    const next = new URLSearchParams(searchParams);

    Object.entries(changes).forEach(([key, value]) => {
      if (value === null || value === "all" || value === undefined) {
        next.delete(key);
      } else {
        next.set(key, value);
      }
    });

    setSearchParams(next, { replace: true });
  };

  const categories = useMemo(() => getProductCategories(), []);
  const bundleTypes = useMemo(() => getBundleTypes(), []);

  const confirmActivation = () => {
    const bundleName = pendingBundle?.name;
    setPendingBundle(null);
    updateParams({ intent: null });
    // Nothing is charged: there is no provisioning or payment integration here.
    showNotice(`Activation is not connected yet, so ${bundleName} was not purchased and nothing was charged.`);
  };

  return (
    <section className="orange-page-section" aria-labelledby="shop-title">
      <div className="orange-page-intro">
        <p className="orange-eyebrow">Orange shop</p>
        <h1 id="shop-title">Devices and plans</h1>
        <p>Compare what is available, then pick up where it suits you.</p>
      </div>

      <div className="omasta-tabs" role="tablist" aria-label="Shop sections">
        {TABS.map((item) => (
          <button
            type="button"
            role="tab"
            key={item.id}
            aria-selected={tab === item.id}
            className={tab === item.id ? "is-active" : ""}
            onClick={() => updateParams({ tab: item.id === "devices" ? null : item.id })}
          >
            {item.label}
          </button>
        ))}
      </div>

      {tab === "devices" ? (
        <>
          <FilterChips
            options={categories}
            value={categoryId}
            onChange={(value) => updateParams({ category: value })}
            label="Filter products"
          />

          {products === null ? (
            <SkeletonList count={4} />
          ) : (
            <div className="omasta-product-grid">
              {products.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onView={() => navigate(`/shop/${product.id}`)}
                  onBuy={() => navigate(`/shop/${product.id}?intent=buy`)}
                />
              ))}
            </div>
          )}
        </>
      ) : (
        <>
          <FilterChips
            options={bundleTypes}
            value={bundleTypeId}
            onChange={(value) => updateParams({ type: value })}
            label="Filter bundles"
          />

          {bundles === null ? (
            <SkeletonList count={3} />
          ) : (
            <div className="omasta-bundle-grid">
              {bundles.map((bundle) => (
                <article
                  className={`omasta-bundle-card ${highlightedBundleId === bundle.id ? "is-highlighted" : ""}`}
                  key={bundle.id}
                >
                  <div className="omasta-bundle-value">
                    <strong>{bundle.name}</strong>
                    <span>{bundle.validity}</span>
                  </div>
                  <p>{bundle.description}</p>
                  <ul>
                    {bundle.perks.map((perk) => (
                      <li key={perk}>
                        <Check size={14} />
                        {perk}
                      </li>
                    ))}
                  </ul>
                  <div className="omasta-bundle-footer">
                    <div className="omasta-bundle-price">
                      <strong>{bundle.price}</strong>
                      {bundle.isDemo ? <DemoBadge label="Demo price" /> : null}
                    </div>
                    <button
                      type="button"
                      className="orange-button orange-button--solid"
                      onClick={() => setPendingBundle(bundle)}
                    >
                      Activate
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </>
      )}

      <DemoNote>
        This catalogue is sample data for development. Real availability and pricing need an Orange catalogue API.
      </DemoNote>

      <button type="button" className="omasta-ask-ai-button omasta-ask-ai-button--block" onClick={() => openAssistant()}>
        <Sparkles size={15} />
        Ask OMASTA AI to help me choose
      </button>

      <BottomSheet
        open={Boolean(pendingBundle)}
        onClose={() => setPendingBundle(null)}
        eyebrow="Confirm before continuing"
        title={pendingBundle ? `Activate ${pendingBundle.name}?` : ""}
        labelledById="activate-bundle-title"
      >
        {pendingBundle ? (
          <div className="omasta-confirm">
            <p>
              {pendingBundle.name} · {pendingBundle.validity} · {pendingBundle.price}
            </p>
            <DemoNote>
              Activation and payment are not connected in this build. Confirming will not charge you or change anything
              on your line.
            </DemoNote>
            <div className="omasta-confirm-actions">
              <button type="button" className="orange-button orange-button--solid" onClick={confirmActivation}>
                I understand, continue
              </button>
              <button
                type="button"
                className="orange-button orange-button--outline"
                onClick={() => setPendingBundle(null)}
              >
                Cancel
              </button>
            </div>
          </div>
        ) : null}
      </BottomSheet>
    </section>
  );
}
