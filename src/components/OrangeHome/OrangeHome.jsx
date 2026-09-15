import { createElement, useCallback, useMemo, useState } from "react";
import {
  ArrowRight,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  CircleHelp,
  Clock3,
  ExternalLink,
  Headphones,
  House,
  LifeBuoy,
  MapPin,
  MapPinned,
  Phone,
  Plus,
  Search,
  ShoppingBag,
  Smartphone,
  Store,
  UserRound,
  WalletCards,
  Wifi,
  X,
} from "lucide-react";

import "./OrangeHome.css";
import OrangeMap from "./OrangeMap.jsx";

const PRODUCTS = [
  {
    id: "home-router",
    category: "Home internet",
    name: "Orange 4G Home Router",
    description: "Reliable internet for your home and office.",
    price: "SLE 1,250",
    note: "Device only",
    kind: "router",
  },
  {
    id: "mifi",
    category: "On-the-go internet",
    name: "Orange 4G MiFi",
    description: "Take a fast, personal hotspot wherever you go.",
    price: "SLE 850",
    note: "Device only",
    kind: "mifi",
  },
  {
    id: "smart-connect",
    category: "Bundle offer",
    name: "Smart Connect Starter",
    description: "A simple way to get connected from day one.",
    price: "SLE 420",
    note: "Limited-time offer",
    kind: "starter",
  },
];

const QUICK_ACTIONS = [
  { label: "Buy data", detail: "Browse bundles", icon: Wifi, tab: "shop" },
  { label: "Buy airtime", detail: "Top up a number", icon: Smartphone, tab: "shop" },
  { label: "Orange Money", detail: "Find a money point", icon: WalletCards, tab: "find" },
  { label: "Get support", detail: "We are here to help", icon: Headphones, tab: "support" },
];

const FIND_OPTIONS = [
  { label: "Find agents", detail: "Authorized Orange agents", icon: MapPin, tab: "find" },
  { label: "Orange shops", detail: "Stores and service centers", icon: Store, tab: "find" },
  { label: "Money points", detail: "Cash in and cash out", icon: WalletCards, tab: "find" },
  { label: "Support centers", detail: "Help with SIMs and devices", icon: LifeBuoy, tab: "support" },
];

const LOCATIONS = [
  { id: "siaka-shop", name: "Orange Shop · Siaka Stevens Street", type: "Orange shop", category: "shop", distance: "0.8 km", status: "Open now", icon: Store, coordinates: [-13.2316, 8.4863], mapPosition: { x: 34, y: 42 } },
  { id: "wilkinson-money", name: "Orange Money Point · Wilkinson Road", type: "Money point", category: "money", distance: "1.4 km", status: "Open now", icon: WalletCards, coordinates: [-13.2423, 8.4827], mapPosition: { x: 63, y: 33 } },
  { id: "kissy-agent", name: "Orange Agent · Kissy Road", type: "Authorized agent", category: "agent", distance: "2.1 km", status: "Closes at 6:00 PM", icon: MapPin, coordinates: [-13.2034, 8.4878], mapPosition: { x: 71, y: 68 } },
];

const LOCATION_FILTERS = [
  { id: "all", label: "All locations" },
  { id: "shop", label: "Orange shops" },
  { id: "money", label: "Money points" },
];

const SUPPORT_OPTIONS = [
  { label: "Call Orange", detail: "Speak with customer care", icon: Phone },
  { label: "Visit a support center", detail: "Get in-person assistance", icon: Store },
  { label: "Help center", detail: "Find answers to common questions", icon: CircleHelp },
];

function ProductArtwork({ kind }) {
  return (
    <div className={`orange-product-art orange-product-art--${kind}`} aria-hidden="true">
      <div className="orange-product-glow" />
      <div className="orange-product-device">
        <div className="orange-product-device-screen">
          <Wifi size={26} strokeWidth={1.8} />
        </div>
        <span className="orange-product-device-light" />
        <span className="orange-product-device-line" />
      </div>
      <span className="orange-product-orbit orange-product-orbit--one" />
      <span className="orange-product-orbit orange-product-orbit--two" />
    </div>
  );
}

function SectionHeading({ eyebrow, title, action, onAction }) {
  return (
    <div className="orange-section-heading">
      <div>
        <p className="orange-eyebrow">{eyebrow}</p>
        <h2>{title}</h2>
      </div>
      {action ? (
        <button type="button" className="orange-text-button" onClick={onAction}>
          {action}
          <ArrowRight size={15} />
        </button>
      ) : null}
    </div>
  );
}

function EmptySearchState({ query }) {
  return (
    <div className="orange-search-empty">
      <Search size={21} />
      <p>No results for “{query}”</p>
      <span>Try searching for a product, agent, shop, or support.</span>
    </div>
  );
}

export default function OrangeHome() {
  const [activeTab, setActiveTab] = useState("home");
  const [productIndex, setProductIndex] = useState(0);
  const [findFilter, setFindFilter] = useState("all");
  const [customLocations, setCustomLocations] = useState([]);
  const [locationModalOpen, setLocationModalOpen] = useState(false);
  const [locationDraft, setLocationDraft] = useState({ name: "", type: "shop", address: "" });
  const [liveMapFailed, setLiveMapFailed] = useState(false);
  const [locateRequest, setLocateRequest] = useState(0);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [supportOpen, setSupportOpen] = useState(false);
  const [notice, setNotice] = useState("");

  const product = PRODUCTS[productIndex];
  const hasMapTilerKey = Boolean(import.meta.env.VITE_MAPTILER_API_KEY);

  const allLocations = useMemo(() => [...LOCATIONS, ...customLocations], [customLocations]);

  const visibleLocations = useMemo(() => {
    if (findFilter === "all") {
      return allLocations;
    }

    return allLocations.filter((location) => location.category === findFilter);
  }, [allLocations, findFilter]);

  const searchResults = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();

    if (!normalizedQuery) {
      return { products: PRODUCTS.slice(0, 2), locations: allLocations.slice(0, 2) };
    }

    return {
      products: PRODUCTS.filter((item) =>
        `${item.name} ${item.category} ${item.description}`.toLowerCase().includes(normalizedQuery)
      ),
      locations: allLocations.filter((item) =>
        `${item.name} ${item.type}`.toLowerCase().includes(normalizedQuery)
      ),
    };
  }, [allLocations, searchQuery]);

  function showNotice(message) {
    setNotice(message);
  }

  function goToTab(tab) {
    setActiveTab(tab);
    setSearchOpen(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function openSearch() {
    setSearchOpen(true);
    setSearchQuery("");
  }

  function handleProductAction() {
    showNotice(`${product.name} details are ready for the next step.`);
  }

  const handleMapError = useCallback(() => {
    setLiveMapFailed(true);
  }, []);

  function handleUseLocation() {
    if (hasMapTilerKey && !liveMapFailed) {
      setLocateRequest((current) => current + 1);
      return;
    }

    showNotice("Location access will be connected when the live map is configured.");
  }

  function handleLocationSubmit(event) {
    event.preventDefault();
    const trimmedName = locationDraft.name.trim();

    if (!trimmedName) {
      showNotice("Add a name for this location before saving it.");
      return;
    }

    const typeConfig = {
      shop: { type: "Orange shop", category: "shop", icon: Store },
      money: { type: "Money point", category: "money", icon: WalletCards },
      agent: { type: "Authorized agent", category: "agent", icon: MapPin },
    }[locationDraft.type];

    const location = {
      id: `custom-${Date.now()}`,
      name: trimmedName,
      type: typeConfig.type,
      category: typeConfig.category,
      distance: "Saved location",
      status: locationDraft.address.trim() || "Added by you",
      icon: typeConfig.icon,
      coordinates: [-13.234, 8.49],
      mapPosition: { x: 49, y: 55 },
    };

    setCustomLocations((current) => [...current, location]);
    setLocationDraft({ name: "", type: "shop", address: "" });
    setLocationModalOpen(false);
    showNotice(`${trimmedName} has been added to your locations.`);
  }

  function renderHome() {
    return (
      <>
        <section className="orange-section orange-featured-section" aria-label="Featured Orange product">
          <SectionHeading
            eyebrow="Featured for you"
            title="Stay connected"
            action="See all"
            onAction={() => goToTab("shop")}
          />

          <article className="orange-product-card">
            <div className="orange-product-card-copy">
              <span className="orange-product-badge">Available now</span>
              <p className="orange-product-category">{product.category}</p>
              <h1>{product.name}</h1>
              <p className="orange-product-description">{product.description}</p>
              <div className="orange-product-price-row">
                <div>
                  <span className="orange-product-price-label">From</span>
                  <strong>{product.price}</strong>
                </div>
                <span className="orange-product-note">{product.note}</span>
              </div>
              <div className="orange-product-actions">
                <button type="button" className="orange-button orange-button--light" onClick={handleProductAction}>
                  View details
                  <ArrowRight size={16} />
                </button>
                <button
                  type="button"
                  className="orange-button orange-button--outline"
                  onClick={() => showNotice(`${product.name} has been added to your interest list.`)}
                >
                  Buy
                </button>
              </div>
            </div>
            <ProductArtwork kind={product.kind} />
            <div className="orange-product-carousel-controls">
              <button
                type="button"
                aria-label="Previous product"
                onClick={() => setProductIndex((current) => (current - 1 + PRODUCTS.length) % PRODUCTS.length)}
              >
                <ChevronLeft size={17} />
              </button>
              <div className="orange-product-dots" aria-label={`${productIndex + 1} of ${PRODUCTS.length} products`}>
                {PRODUCTS.map((item, index) => (
                  <button
                    type="button"
                    key={item.id}
                    className={index === productIndex ? "is-active" : ""}
                    aria-label={`Show ${item.name}`}
                    onClick={() => setProductIndex(index)}
                  />
                ))}
              </div>
              <button
                type="button"
                aria-label="Next product"
                onClick={() => setProductIndex((current) => (current + 1) % PRODUCTS.length)}
              >
                <ChevronRight size={17} />
              </button>
            </div>
          </article>
        </section>

        <section className="orange-section" aria-label="Orange quick actions">
          <SectionHeading eyebrow="Shortcuts" title="What do you want to do?" />
          <div className="orange-quick-actions">
            {QUICK_ACTIONS.map(({ label, detail, icon, tab }) => (
              <button type="button" className="orange-quick-action" key={label} onClick={() => goToTab(tab)}>
                <span className="orange-icon-box">{createElement(icon, { size: 20 })}</span>
                <span>
                  <strong>{label}</strong>
                  <small>{detail}</small>
                </span>
                <ChevronRight className="orange-quick-action-arrow" size={17} />
              </button>
            ))}
          </div>
        </section>

        <section className="orange-section" aria-label="Find Orange services">
          <SectionHeading
            eyebrow="Around you"
            title="Find Orange"
            action="Open map"
            onAction={() => goToTab("find")}
          />
          <div className="orange-find-grid">
            {FIND_OPTIONS.map(({ label, detail, icon, tab }) => (
              <button type="button" className="orange-find-card" key={label} onClick={() => goToTab(tab)}>
                <span className="orange-find-icon">{createElement(icon, { size: 21 })}</span>
                <span>
                  <strong>{label}</strong>
                  <small>{detail}</small>
                </span>
                <ArrowRight className="orange-find-arrow" size={17} />
              </button>
            ))}
          </div>
        </section>

        <section className="orange-help-strip" aria-label="Orange support">
          <span className="orange-help-strip-icon"><CircleHelp size={21} /></span>
          <div>
            <strong>Need a hand?</strong>
            <p>Our support team is ready to help you get connected.</p>
          </div>
          <button type="button" onClick={() => setSupportOpen(true)} aria-label="Open Orange support">
            <ArrowRight size={18} />
          </button>
        </section>
      </>
    );
  }

  function renderShop() {
    return (
      <section className="orange-page-section" aria-labelledby="shop-title">
        <div className="orange-page-intro">
          <p className="orange-eyebrow">Orange shop</p>
          <h1 id="shop-title">Products that keep you connected.</h1>
          <p>Explore devices and starter offers made for home, work, and life on the go.</p>
        </div>
        <div className="orange-shop-grid">
          {PRODUCTS.map((item) => (
            <article className="orange-shop-card" key={item.id}>
              <ProductArtwork kind={item.kind} />
              <div className="orange-shop-card-copy">
                <p className="orange-product-category">{item.category}</p>
                <h2>{item.name}</h2>
                <p>{item.description}</p>
                <div className="orange-shop-card-footer">
                  <strong>{item.price}</strong>
                  <button type="button" onClick={() => showNotice(`${item.name} details are ready for the next step.`)}>
                    View <ArrowRight size={15} />
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>
    );
  }

  function renderFind() {
    return (
      <section className="orange-page-section" aria-labelledby="find-title">
        <div className="orange-find-heading">
          <h1 id="find-title">Find Orange</h1>
        </div>
        <div className="orange-find-map-shell">
          <div className="orange-location-toolbar">
            <div className="orange-location-status"><MapPinned size={18} /><span>Freetown area</span></div>
            <div className="orange-location-toolbar-actions">
              <button type="button" onClick={handleUseLocation}>
                Use my location <MapPin size={15} />
              </button>
              <button type="button" className="orange-add-location-button" onClick={() => setLocationModalOpen(true)}>
                <Plus size={16} /> Add location
              </button>
            </div>
          </div>
          {hasMapTilerKey && !liveMapFailed ? (
            <OrangeMap
              locations={visibleLocations}
              locateRequest={locateRequest}
              onLocationClick={(location) => showNotice(`${location.name} selected. Directions will open here.`)}
              onMapError={handleMapError}
            />
          ) : (
            <div className="orange-map" role="img" aria-label="Orange locations map">
              <span className="orange-map-water orange-map-water--one" />
              <span className="orange-map-water orange-map-water--two" />
              <span className="orange-map-road orange-map-road--one" />
              <span className="orange-map-road orange-map-road--two" />
              <span className="orange-map-road orange-map-road--three" />
              <span className="orange-map-label orange-map-label--freetown">Freetown</span>
              <span className="orange-map-label orange-map-label--water">Atlantic Ocean</span>
              {visibleLocations.map(({ id, name, type, category, icon, mapPosition }) => (
                <button
                  type="button"
                  className={`orange-map-marker orange-map-marker--${category}`}
                  key={id}
                  style={{ left: `${mapPosition.x}%`, top: `${mapPosition.y}%` }}
                  onClick={() => showNotice(`${name} selected. Directions will open here.`)}
                  aria-label={`Select ${type}: ${name}`}
                >
                  <span>{createElement(icon, { size: 16 })}</span>
                  <small>{category === "money" ? "Money point" : category === "shop" ? "Orange shop" : "Agent"}</small>
                </button>
              ))}
              <span className="orange-map-user-location" aria-hidden="true"><span /></span>
            </div>
          )}
          <div className="orange-map-legend">
            <span><i className="orange-map-legend-dot orange-map-legend-dot--shop" /> Orange shop</span>
            <span><i className="orange-map-legend-dot orange-map-legend-dot--money" /> Money point</span>
            <span><i className="orange-map-legend-dot orange-map-legend-dot--agent" /> Agent</span>
          </div>
        </div>
        <div className="orange-find-filters" role="group" aria-label="Filter Orange locations">
          {LOCATION_FILTERS.map(({ id, label }) => (
            <button type="button" className={findFilter === id ? "is-active" : ""} key={id} onClick={() => setFindFilter(id)}>
              {label}
            </button>
          ))}
        </div>
        <div className="orange-location-list">
          {visibleLocations.map(({ id, name, type, distance, status, icon }) => (
            <article className="orange-location-row" key={id}>
              <span className="orange-location-icon">{createElement(icon, { size: 20 })}</span>
              <div className="orange-location-copy">
                <p>{type}</p>
                <h2>{name}</h2>
                <span><CheckCircle2 size={14} /> {status} <b>·</b> {distance}</span>
              </div>
              <button type="button" aria-label={`Get directions to ${name}`} onClick={() => showNotice(`Directions to ${name} will open here.`)}>
                <ExternalLink size={17} />
              </button>
            </article>
          ))}
        </div>
      </section>
    );
  }

  function renderSupport() {
    return (
      <section className="orange-page-section" aria-labelledby="support-title">
        <div className="orange-page-intro">
          <p className="orange-eyebrow">Orange support</p>
          <h1 id="support-title">We are here when you need us.</h1>
          <p>Choose the quickest way to get answers, assistance, or in-person support.</p>
        </div>
        <div className="orange-support-grid">
          {SUPPORT_OPTIONS.map(({ label, detail, icon }) => (
            <button
              type="button"
              className="orange-support-card"
              key={label}
              onClick={() => (label === "Call Orange" ? setSupportOpen(true) : showNotice(`${label} will open in the next step.`))}
            >
              <span className="orange-icon-box">{createElement(icon, { size: 21 })}</span>
              <span><strong>{label}</strong><small>{detail}</small></span>
              <ArrowRight size={17} />
            </button>
          ))}
        </div>
        <div className="orange-support-note">
          <Clock3 size={20} />
          <div><strong>Prefer in-person help?</strong><p>Use Find Orange to see opening hours and nearby service locations.</p></div>
          <button type="button" onClick={() => goToTab("find")}>Find a center <ArrowRight size={15} /></button>
        </div>
      </section>
    );
  }

  function renderAccount() {
    return (
      <section className="orange-page-section" aria-labelledby="account-title">
        <div className="orange-page-intro">
          <p className="orange-eyebrow">Your account</p>
          <h1 id="account-title">Your Orange account.</h1>
          <p>Manage your profile and keep your Orange details close at hand.</p>
        </div>
        <div className="orange-account-card">
          <div className="orange-account-avatar">AJ</div>
          <div><p>Mobile number</p><h2>+232 76 ••• •••</h2><span>Personal account</span></div>
          <CheckCircle2 size={21} />
        </div>
        <div className="orange-account-actions">
          {["My profile", "My products", "Saved locations"].map((item) => (
            <button type="button" key={item} onClick={() => showNotice(`${item} will be available in the next step.`)}>
              <UserRound size={19} /> <span>{item}</span><ChevronRight size={17} />
            </button>
          ))}
        </div>
      </section>
    );
  }

  return (
    <div className="orange-app">
      <header className="orange-header">
        <div className="orange-header-inner">
          <button
            type="button"
            className={`orange-avatar-button ${activeTab === "home" ? "" : "is-disabled"}`}
            onClick={() => goToTab("account")}
            aria-label={activeTab === "home" ? "Open your account" : "Account avatar is available on Home"}
            disabled={activeTab !== "home"}
          >
            <span className="orange-avatar">AJ</span>
          </button>
          <button type="button" className="orange-header-copy" onClick={() => goToTab("home")} aria-label="Go to Orange home">
            <strong>Good morning, Alus</strong>
            <span>Orange Sierra Leone</span>
          </button>
          <div className="orange-header-actions">
            <button type="button" className="orange-header-icon" onClick={() => setSupportOpen(true)} aria-label="Call Orange support">
              <Phone size={19} />
            </button>
            <button type="button" className="orange-header-icon" onClick={openSearch} aria-label="Search Orange">
              <Search size={19} />
            </button>
          </div>
        </div>
      </header>

      <main className="orange-main">
        {activeTab === "home" ? renderHome() : null}
        {activeTab === "shop" ? renderShop() : null}
        {activeTab === "find" ? renderFind() : null}
        {activeTab === "support" ? renderSupport() : null}
        {activeTab === "account" ? renderAccount() : null}
      </main>

      <nav className="orange-bottom-nav" aria-label="Main navigation">
        {[
          { label: "Home", tab: "home", icon: House },
          { label: "Shop", tab: "shop", icon: ShoppingBag },
          { label: "Find", tab: "find", icon: MapPinned },
          { label: "Support", tab: "support", icon: LifeBuoy },
          { label: "Account", tab: "account", icon: UserRound },
        ].map(({ label, tab, icon }) => (
          <button type="button" className={activeTab === tab ? "is-active" : ""} key={tab} onClick={() => goToTab(tab)}>
            {createElement(icon, { size: 19 })}
            <span>{label}</span>
          </button>
        ))}
      </nav>

      {notice ? (
        <div className="orange-notice" role="status">
          <CheckCircle2 size={18} />
          <span>{notice}</span>
          <button type="button" onClick={() => setNotice("")} aria-label="Dismiss message"><X size={17} /></button>
        </div>
      ) : null}

      {searchOpen ? (
        <div className="orange-modal-backdrop" role="presentation" onMouseDown={() => setSearchOpen(false)}>
          <section className="orange-search-modal" role="dialog" aria-modal="true" aria-labelledby="search-title" onMouseDown={(event) => event.stopPropagation()}>
            <div className="orange-modal-heading">
              <div><p className="orange-eyebrow">Search Orange</p><h2 id="search-title">What are you looking for?</h2></div>
              <button type="button" className="orange-modal-close" onClick={() => setSearchOpen(false)} aria-label="Close search"><X size={19} /></button>
            </div>
            <label className="orange-search-field">
              <Search size={19} />
              <input autoFocus value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} placeholder="Products, agents, shops..." />
            </label>
            {searchResults.products.length || searchResults.locations.length ? (
              <div className="orange-search-results">
                {searchResults.products.length ? <p className="orange-result-label">Products</p> : null}
                {searchResults.products.map((item) => <button type="button" key={item.id} onClick={() => { setSearchOpen(false); goToTab("shop"); }}><ShoppingBag size={17} /><span>{item.name}<small>{item.category}</small></span><ArrowRight size={16} /></button>)}
                {searchResults.locations.length ? <p className="orange-result-label">Places</p> : null}
                {searchResults.locations.map((item) => <button type="button" key={item.name} onClick={() => { setSearchOpen(false); goToTab("find"); }}><MapPin size={17} /><span>{item.name}<small>{item.type} · {item.distance}</small></span><ArrowRight size={16} /></button>)}
              </div>
            ) : <EmptySearchState query={searchQuery} />}
          </section>
        </div>
      ) : null}

      {supportOpen ? (
        <div className="orange-modal-backdrop" role="presentation" onMouseDown={() => setSupportOpen(false)}>
          <section className="orange-support-sheet" role="dialog" aria-modal="true" aria-labelledby="support-sheet-title" onMouseDown={(event) => event.stopPropagation()}>
            <div className="orange-sheet-handle" />
            <div className="orange-modal-heading"><div><p className="orange-eyebrow">Orange support</p><h2 id="support-sheet-title">How can we help?</h2></div><button type="button" className="orange-modal-close" onClick={() => setSupportOpen(false)} aria-label="Close support"><X size={19} /></button></div>
            <p className="orange-sheet-description">Choose an option and we’ll guide you from there.</p>
            <button type="button" className="orange-support-choice orange-support-choice--primary" onClick={() => showNotice("Customer care calling will be connected in the next step.")}><span><Phone size={19} /></span><div><strong>Call customer care</strong><small>Speak to an Orange support specialist</small></div><ArrowRight size={17} /></button>
            <button type="button" className="orange-support-choice" onClick={() => { setSupportOpen(false); goToTab("find"); }}><span><MapPin size={19} /></span><div><strong>Find a support center</strong><small>Get help in person near you</small></div><ArrowRight size={17} /></button>
          </section>
        </div>
      ) : null}

      {locationModalOpen ? (
        <div className="orange-modal-backdrop" role="presentation" onMouseDown={() => setLocationModalOpen(false)}>
          <section className="orange-location-modal" role="dialog" aria-modal="true" aria-labelledby="add-location-title" onMouseDown={(event) => event.stopPropagation()}>
            <div className="orange-modal-heading">
              <div><p className="orange-eyebrow">Find Orange</p><h2 id="add-location-title">Add a location</h2></div>
              <button type="button" className="orange-modal-close" onClick={() => setLocationModalOpen(false)} aria-label="Close add location"><X size={19} /></button>
            </div>
            <p className="orange-sheet-description">Save a useful Orange place so it is easy to find again.</p>
            <form className="orange-location-form" onSubmit={handleLocationSubmit}>
              <label>Location name<input autoFocus value={locationDraft.name} onChange={(event) => setLocationDraft((current) => ({ ...current, name: event.target.value }))} placeholder="e.g. Orange Shop, Lumley" required /></label>
              <label>Location type<select value={locationDraft.type} onChange={(event) => setLocationDraft((current) => ({ ...current, type: event.target.value }))}><option value="shop">Orange shop</option><option value="money">Money point</option><option value="agent">Authorized agent</option></select></label>
              <label>Address or note <span className="orange-optional-label">Optional</span><input value={locationDraft.address} onChange={(event) => setLocationDraft((current) => ({ ...current, address: event.target.value }))} placeholder="e.g. Wilkinson Road" /></label>
              <button type="submit" className="orange-button orange-button--solid">Save location <Plus size={16} /></button>
            </form>
          </section>
        </div>
      ) : null}
    </div>
  );
}
