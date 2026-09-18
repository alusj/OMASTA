import { useNavigate } from "react-router-dom";
import { Bell, ChevronRight, LifeBuoy, MapPin, ShieldCheck, Smartphone, UserRound } from "lucide-react";

import { DemoNote } from "../components/common/DemoBadge.jsx";
import SectionHeading from "../components/common/SectionHeading.jsx";
import { DEMO_CUSTOMER } from "../data/customer.js";
import { useAppUi } from "../context/AppUiProvider.jsx";
import { useAssistantScreenContext } from "../hooks/useAssistantScreenContext.js";

const ACTIONS = [
  { id: "profile", label: "My profile", detail: "Name, contact and preferences", icon: UserRound },
  { id: "products", label: "My products", detail: "Devices and plans on this line", icon: Smartphone },
  { id: "saved", label: "Saved locations", detail: "Places you use often", icon: MapPin },
  { id: "notifications", label: "Notifications", detail: "What OMASTA can tell you about", icon: Bell },
  { id: "security", label: "Security", detail: "Sign-in and account protection", icon: ShieldCheck },
];

/**
 * Account.
 *
 * There is no authentication in this build, so this screen shows a demo profile
 * and says so. It deliberately shows no balance or usage figure: inventing one
 * would misrepresent the customer's real line.
 */
export default function AccountScreen() {
  const navigate = useNavigate();
  const { showNotice, openSupportSheet } = useAppUi();

  useAssistantScreenContext({ screen: "account" }, []);

  return (
    <section className="orange-page-section" aria-labelledby="account-title">
      <div className="orange-page-intro">
        <p className="orange-eyebrow">Your account</p>
        <h1 id="account-title">Your Orange account</h1>
        <p>Your line details and the things you keep coming back to.</p>
      </div>

      <div className="orange-account-card">
        <div className="orange-account-avatar">{DEMO_CUSTOMER.initials}</div>
        <div>
          <p>Mobile number</p>
          <h2>{DEMO_CUSTOMER.maskedNumber}</h2>
          <span>{DEMO_CUSTOMER.planLabel}</span>
        </div>
      </div>

      <DemoNote>
        This is a demo profile. Sign-in is not connected, so no real account, number, balance or usage is shown here.
      </DemoNote>

      <SectionHeading eyebrow="Manage" title="Account settings" />

      <div className="orange-account-actions">
        {ACTIONS.map((action) => {
          const Icon = action.icon;

          return (
            <button
              type="button"
              key={action.id}
              onClick={() =>
                showNotice(`${action.label} needs a signed-in Orange account API, which is not connected in this build.`)
              }
            >
              <Icon size={19} />
              <span>
                <strong>{action.label}</strong>
                <small>{action.detail}</small>
              </span>
              <ChevronRight size={17} />
            </button>
          );
        })}
      </div>

      <div className="orange-support-note">
        <LifeBuoy size={20} />
        <div>
          <strong>Need something changed on your line?</strong>
          <p>Orange customer care or a shop can help with anything account specific.</p>
        </div>
        <button type="button" onClick={() => openSupportSheet()}>
          Get support
        </button>
      </div>

      <button type="button" className="omasta-secondary-link" onClick={() => navigate("/find?category=shop")}>
        Find an Orange shop
      </button>

      <button type="button" className="omasta-admin-link" onClick={() => navigate("/admin")}>
        Orange admin: review suggested locations
      </button>
    </section>
  );
}
