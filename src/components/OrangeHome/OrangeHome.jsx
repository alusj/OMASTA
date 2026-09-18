import { useCallback, useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

import "./OrangeHome.css";

import SectionHeading from "../common/SectionHeading.jsx";
import DemoBadge from "../common/DemoBadge.jsx";
import OrangeMoneyCard from "../home/OrangeMoneyCard.jsx";
import OrangeServicesRow from "../home/OrangeServicesRow.jsx";
import HomeAssistantPrompt from "../home/HomeAssistantPrompt.jsx";
import HomeRail, { HomeRailItem } from "../home/HomeRail.jsx";
import OfferCard from "../home/OfferCard.jsx";
import AroundYouPreview from "../home/AroundYouPreview.jsx";
import RecentActivityList from "../home/RecentActivityList.jsx";
import CompactProductCard from "../products/CompactProductCard.jsx";
import MoneyFlowSheet from "../money/MoneyFlowSheet.jsx";
import { getHomeServices } from "../../data/orangeServices.js";
import { getAccountSummary, listRecentActivity } from "../../services/account/accountService.js";
import { listFeaturedProducts } from "../../services/catalog/catalogService.js";
import { listOffers } from "../../services/offers/offerService.js";
import { AssistantIntent } from "../../services/assistant/assistantTypes.js";
import { MoneyFlowKind } from "../../services/money/moneyService.js";
import { useAppUi } from "../../context/AppUiProvider.jsx";
import { useAssistant } from "../../context/AssistantProvider.jsx";
import { useLocationContext } from "../../context/LocationProvider.jsx";
import { useAssistantScreenContext } from "../../hooks/useAssistantScreenContext.js";
import { useServiceResource } from "../../hooks/useServiceResource.js";

const HOME_SERVICES = getHomeServices();
const loadRecentActivity = () => listRecentActivity({ limit: 3 });

/**
 * Home: a glance at everything Orange.
 *
 * Order is fixed: balance, services, OMASTA AI, products, offers, around you,
 * recent activity. Each section is a presentational component fed by a
 * service, so demo data can be replaced by Orange APIs without touching the UI.
 * Deeper functionality lives in Shop, Find, Support and Account.
 */
export default function OrangeHome() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { runAction, openAssistant } = useAssistant();
  const { showNotice } = useAppUi();
  const { coordinates, isLocating, requestLocation } = useLocationContext();

  const account = useServiceResource(getAccountSummary);
  const products = useServiceResource(listFeaturedProducts);
  const offers = useServiceResource(listOffers);
  const activity = useServiceResource(loadRecentActivity);

  const [moneyFlow, setMoneyFlow] = useState(null);
  const closeMoneyFlow = useCallback(() => setMoneyFlow(null), []);

  useAssistantScreenContext({ screen: "home" }, []);

  // Deep links such as /orange?section=offers (used by OMASTA AI). Waits for
  // the shell's scroll-to-top on route change before scrolling.
  const section = searchParams.get("section");
  useEffect(() => {
    if (!section) {
      return undefined;
    }

    const timer = window.setTimeout(() => {
      document.getElementById(`home-${section}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 350);

    return () => window.clearTimeout(timer);
  }, [section]);

  const handleRequestLocation = async () => {
    const result = await requestLocation();

    if (!result.coordinates) {
      showNotice(result.message || "Location is not available. Pick an area on the map instead.");
      navigate("/find");
    }
  };

  const summary = account.data;

  return (
    <div className="omasta-home">
      {/* The visible greeting lives in the header, so the page keeps its own
          heading for screen readers and document outline. */}
      <h1 className="omasta-visually-hidden">Orange home</h1>

      <div className="omasta-home-top">
        <div className="omasta-home-balance">
          <OrangeMoneyCard
            orangeMoneyBalance={summary?.orangeMoneyBalance}
            airtimeBalance={summary?.airtimeBalance}
            dataBalance={summary?.dataBalance}
            currency={summary?.currency}
            isDemo={Boolean(summary?.isDemo)}
            loading={account.loading}
            error={account.error}
            onRetry={account.reload}
            onSend={() => setMoneyFlow(MoneyFlowKind.SEND)}
            onRequest={() => setMoneyFlow(MoneyFlowKind.REQUEST)}
          />
        </div>

        <section className="omasta-home-section omasta-home-services" aria-labelledby="home-services-title">
          <SectionHeading
            variant="compact"
            id="home-services-title"
            title="Orange services"
            action="View all"
            actionLabel="View all Orange services"
            onAction={() => navigate("/services")}
          />
          <OrangeServicesRow services={HOME_SERVICES} onSelect={(service) => runAction(service.action)} />
        </section>

        <div className="omasta-home-ai-slot">
          <HomeAssistantPrompt
            onOpen={openAssistant}
            onVoice={() => {
              openAssistant({ focusInput: true });
              showNotice("Voice input is not available yet. Type your question for now.");
            }}
          />
        </div>
      </div>

      <section className="omasta-home-section" id="home-products" aria-labelledby="home-products-title">
        <SectionHeading
          variant="compact"
          id="home-products-title"
          title="Orange products"
          badge={<DemoBadge label="Demo prices" />}
          action="See all"
          actionLabel="See all Orange products"
          onAction={() => navigate("/shop")}
        />
        <HomeRail label="Orange products" loading={products.loading}>
          {(products.data || []).map((product) => (
            <HomeRailItem key={product.id}>
              <CompactProductCard product={product} />
            </HomeRailItem>
          ))}
        </HomeRail>
      </section>

      <section className="omasta-home-section" id="home-offers" aria-labelledby="home-offers-title">
        <SectionHeading
          variant="compact"
          id="home-offers-title"
          title="Offers for you"
          badge={<DemoBadge label="Sample offers" />}
          action="See all"
          actionLabel="See all offers"
          onAction={() => navigate("/shop?tab=bundles")}
        />
        <HomeRail label="Offers for you" loading={offers.loading} skeletonCount={4}>
          {(offers.data || []).map((offer) => (
            <HomeRailItem key={offer.id}>
              <OfferCard
                offer={offer}
                onOpen={(item) => runAction(item.action)}
                onAsk={(item) =>
                  openAssistant({
                    prompt: `Tell me about the ${item.title} offer`,
                    intent: AssistantIntent.OFFER_INFO,
                    focus: { offerId: item.id },
                  })
                }
              />
            </HomeRailItem>
          ))}
        </HomeRail>
      </section>

      <div className="omasta-home-bottom">
        <section className="omasta-home-section" id="home-around" aria-labelledby="home-around-title">
          <SectionHeading
            variant="compact"
            id="home-around-title"
            title="Around you"
            action="Open map"
            actionLabel="Open the Find Orange map"
            onAction={() => navigate("/find")}
          />
          <AroundYouPreview
            coordinates={coordinates}
            isLocating={isLocating}
            onOpenCategory={(category) => navigate(`/find?category=${category}`)}
            onRequestLocation={handleRequestLocation}
          />
        </section>

        <section className="omasta-home-section" id="home-activity" aria-labelledby="home-activity-title">
          <SectionHeading
            variant="compact"
            id="home-activity-title"
            title="Recent activity"
            badge={<DemoBadge label="Demo" />}
            action="See all"
            actionLabel="See all recent activity"
            onAction={() => navigate("/activity")}
          />
          <RecentActivityList
            items={activity.data}
            loading={activity.loading}
            error={activity.error}
            onRetry={activity.reload}
          />
        </section>
      </div>

      {moneyFlow ? (
        <MoneyFlowSheet
          key={moneyFlow}
          kind={moneyFlow}
          open
          onClose={closeMoneyFlow}
          availableBalance={summary?.orangeMoneyBalance ?? 0}
          currency={summary?.currency}
          isDemoBalance={Boolean(summary?.isDemo)}
        />
      ) : null}
    </div>
  );
}
