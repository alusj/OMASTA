import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, LifeBuoy, MapPin, Search, Sparkles, Wifi } from "lucide-react";

import BottomSheet from "../common/BottomSheet.jsx";
import { searchCatalog } from "../../services/catalog/catalogService.js";
import { searchLocations } from "../../services/locations/locationService.js";
import { listSupportTopics } from "../../services/support/supportService.js";
import { useAppUi } from "../../context/AppUiProvider.jsx";
import { useAssistant } from "../../context/AssistantProvider.jsx";

const QUICK_SEARCHES = ["4G router", "Orange Money", "data bundle", "SIM"];

/**
 * Global search across the demo catalogue, locations and support topics.
 *
 * Anything it cannot answer is handed to OMASTA AI rather than dead-ending.
 */
export default function GlobalSearchSheet() {
  const navigate = useNavigate();
  const { searchOpen, searchSeed, closeSearch } = useAppUi();
  const { openAssistant } = useAssistant();
  const [query, setQuery] = useState("");

  useEffect(() => {
    if (searchOpen) {
      setQuery(searchSeed || "");
    }
  }, [searchOpen, searchSeed]);

  const results = useMemo(() => {
    const term = query.trim();

    if (!term) {
      return null;
    }

    const { products, bundles } = searchCatalog(term);
    const topics = listSupportTopics().filter((topic) =>
      `${topic.title} ${topic.summary}`.toLowerCase().includes(term.toLowerCase())
    );

    return { products, bundles, locations: searchLocations(term), topics };
  }, [query]);

  const hasResults =
    results && (results.products.length || results.bundles.length || results.locations.length || results.topics.length);

  const go = (path) => {
    closeSearch();
    navigate(path);
  };

  return (
    <BottomSheet
      open={searchOpen}
      onClose={closeSearch}
      eyebrow="Search"
      title="What are you looking for?"
      labelledById="global-search-title"
    >
      <label className="orange-search-field">
        <Search size={19} />
        <input
          autoFocus
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Products, bundles, locations, help topics..."
          aria-label="Search OMASTA"
        />
      </label>

      {!query.trim() ? (
        <div className="omasta-search-quick">
          <p className="orange-result-label">Try</p>
          <div className="omasta-chips">
            {QUICK_SEARCHES.map((term) => (
              <button type="button" key={term} onClick={() => setQuery(term)}>
                {term}
              </button>
            ))}
          </div>
        </div>
      ) : null}

      {results && hasResults ? (
        <div className="orange-search-results">
          {results.products.length ? <p className="orange-result-label">Products</p> : null}
          {results.products.map((product) => (
            <button type="button" key={product.id} onClick={() => go(`/shop/${product.id}`)}>
              <Wifi size={17} />
              <span>
                {product.name}
                <small>
                  {product.category} · {product.price}
                </small>
              </span>
              <ArrowRight size={16} />
            </button>
          ))}

          {results.bundles.length ? <p className="orange-result-label">Bundles</p> : null}
          {results.bundles.map((bundle) => (
            <button type="button" key={bundle.id} onClick={() => go(`/shop?tab=bundles&bundle=${bundle.id}`)}>
              <Wifi size={17} />
              <span>
                {bundle.name}
                <small>
                  {bundle.validity} · {bundle.price}
                </small>
              </span>
              <ArrowRight size={16} />
            </button>
          ))}

          {results.locations.length ? <p className="orange-result-label">Places</p> : null}
          {results.locations.map((location) => (
            <button
              type="button"
              key={location.id}
              onClick={() => go(`/find?category=${location.category}&location=${location.id}`)}
            >
              <MapPin size={17} />
              <span>
                {location.name}
                <small>
                  {location.type} · Demo record
                </small>
              </span>
              <ArrowRight size={16} />
            </button>
          ))}

          {results.topics.length ? <p className="orange-result-label">Help</p> : null}
          {results.topics.map((topic) => (
            <button type="button" key={topic.id} onClick={() => go(`/support?topic=${topic.id}`)}>
              <LifeBuoy size={17} />
              <span>
                {topic.title}
                <small>{topic.summary}</small>
              </span>
              <ArrowRight size={16} />
            </button>
          ))}
        </div>
      ) : null}

      {results && !hasResults ? (
        <div className="orange-search-empty">
          <Search size={21} />
          <p>No results for “{query}”</p>
          <span>OMASTA AI can look at this from another angle.</span>
          <button
            type="button"
            className="omasta-ask-ai-button"
            onClick={() => {
              closeSearch();
              openAssistant({ prompt: query });
            }}
          >
            <Sparkles size={15} />
            Ask OMASTA AI
          </button>
        </div>
      ) : null}
    </BottomSheet>
  );
}
