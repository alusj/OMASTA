import { useNavigate } from "react-router-dom";
import { ArrowRight, LifeBuoy, MapPin, Sparkles, Store, Wallet } from "lucide-react";

import "./OrangeHome.css";

import SectionHeading from "../common/SectionHeading.jsx";
import ProductCarousel from "../products/ProductCarousel.jsx";
import QuickActions from "../home/QuickActions.jsx";
import OffersSection from "../home/OffersSection.jsx";
import ServiceStatusSection from "../home/ServiceStatusSection.jsx";
import { getFeaturedProducts } from "../../services/catalog/catalogService.js";
import { useAssistant } from "../../context/AssistantProvider.jsx";
import { useAssistantScreenContext } from "../../hooks/useAssistantScreenContext.js";

const FIND_SHORTCUTS = [
  { id: "agent", label: "Orange agents", detail: "Airtime, data and cash", icon: MapPin },
  { id: "shop", label: "Orange shops", detail: "Devices and account help", icon: Store },
  { id: "money", label: "Orange Money", detail: "Cash in and cash out", icon: Wallet },
  { id: "support", label: "Support centres", detail: "SIM, device and billing help", icon: LifeBuoy },
];

/**
 * Home: the Orange dashboard.
 *
 * Every section here is a composition of reusable components; the screen itself
 * only decides what appears and in what order.
 */
export default function OrangeHome() {
  const navigate = useNavigate();
  const { runAction, openAssistant } = useAssistant();
  const featured = getFeaturedProducts();

  useAssistantScreenContext({ screen: "home" }, []);

  return (
    <>
      {/* The visible greeting lives in the header, so the page keeps its own
          heading for screen readers and document outline. */}
      <h1 className="omasta-visually-hidden">Orange home</h1>

      <section className="orange-section" aria-label="Featured Orange products">
        <SectionHeading
          eyebrow="Featured for you"
          title="Stay connected"
          action="See all"
          onAction={() => navigate("/shop")}
        />
        <ProductCarousel
          products={featured}
          onView={(product) => navigate(`/shop/${product.id}`)}
          onBuy={(product) => navigate(`/shop/${product.id}?intent=buy`)}
        />
      </section>

      <section className="orange-section" aria-label="Quick actions">
        <SectionHeading eyebrow="Shortcuts" title="What do you want to do?" />
        <QuickActions onAction={runAction} />
      </section>

      <section className="orange-section" aria-label="Find Orange">
        <SectionHeading
          eyebrow="Around you"
          title="Find Orange"
          action="Open map"
          onAction={() => navigate("/find?view=map")}
        />
        <div className="omasta-find-shortcuts">
          {FIND_SHORTCUTS.map((shortcut) => {
            const Icon = shortcut.icon;

            return (
              <button
                type="button"
                className="omasta-find-shortcut"
                key={shortcut.id}
                onClick={() => navigate(`/find?category=${shortcut.id}`)}
              >
                <span className="orange-find-icon">
                  <Icon size={20} />
                </span>
                <span>
                  <strong>{shortcut.label}</strong>
                  <small>{shortcut.detail}</small>
                </span>
                <ArrowRight className="orange-find-arrow" size={17} />
              </button>
            );
          })}
        </div>
      </section>

      <section className="orange-section" aria-label="Offers for you">
        <SectionHeading eyebrow="Offers for you" title="Picked to get you going" />
        <OffersSection
          onAction={runAction}
          onAskAssistant={(offer) =>
            openAssistant({ prompt: `Tell me about the offer: ${offer.title}` })
          }
        />
      </section>

      <section className="orange-section" aria-label="Service status">
        <SectionHeading eyebrow="Service status" title="How things are running" />
        <ServiceStatusSection onReportProblem={() => navigate("/support?topic=network")} />
      </section>

      <section className="omasta-assistant-strip" aria-label="OMASTA AI">
        <span className="omasta-assistant-strip-icon">
          <Sparkles size={20} />
        </span>
        <div>
          <strong>Not sure where to start?</strong>
          <p>Ask OMASTA AI to find a location, compare bundles or sort out a problem.</p>
        </div>
        <button type="button" onClick={() => openAssistant()}>
          Ask OMASTA
          <ArrowRight size={16} />
        </button>
      </section>
    </>
  );
}
