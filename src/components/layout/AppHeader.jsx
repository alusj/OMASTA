import { useNavigate } from "react-router-dom";
import { Phone, Search } from "lucide-react";

import { DEMO_CUSTOMER, greetingForHour } from "../../data/customer.js";
import { useAppUi } from "../../context/AppUiProvider.jsx";

/**
 * App header: profile on the left, search and support on the right.
 * Compact on phones, roomier on desktop, sticky on both.
 */
export default function AppHeader() {
  const navigate = useNavigate();
  const { openSearch, openSupportSheet } = useAppUi();

  return (
    <header className="orange-header">
      <div className="orange-header-inner">
        <button
          type="button"
          className="orange-avatar-button"
          onClick={() => navigate("/account")}
          aria-label="Open your account"
        >
          <span className="orange-avatar">{DEMO_CUSTOMER.initials}</span>
        </button>

        <button
          type="button"
          className="orange-header-copy"
          onClick={() => navigate("/orange")}
          aria-label="Go to home"
        >
          <strong>
            {greetingForHour()}, {DEMO_CUSTOMER.firstName}
          </strong>
          <span>
            {DEMO_CUSTOMER.planLabel} · {DEMO_CUSTOMER.market}
          </span>
        </button>

        <div className="orange-header-actions">
          <button type="button" className="orange-header-icon" onClick={() => openSearch()} aria-label="Search OMASTA">
            <Search size={19} />
          </button>
          <button
            type="button"
            className="orange-header-icon"
            onClick={() => openSupportSheet()}
            aria-label="Open support options"
          >
            <Phone size={19} />
          </button>
        </div>
      </div>
    </header>
  );
}
