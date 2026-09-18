import { useState } from "react";
import { ArrowDownLeft, ArrowUpRight, Eye, EyeOff, RotateCw, Smartphone, Wifi } from "lucide-react";

import { Skeleton } from "../common/Skeleton.jsx";
import { formatDataAmount, formatMoney } from "../../utils/format.js";

const VISIBILITY_KEY = "omasta.balanceHidden";

function readHiddenPreference() {
  try {
    return window.localStorage.getItem(VISIBILITY_KEY) === "1";
  } catch {
    return false;
  }
}

function writeHiddenPreference(hidden) {
  try {
    window.localStorage.setItem(VISIBILITY_KEY, hidden ? "1" : "0");
  } catch {
    // Storage can be unavailable (private mode); the toggle still works for this visit.
  }
}

/**
 * The Orange Money balance card: the first thing on Home.
 *
 * Purely presentational. It receives balances from whoever loads them (today
 * the demo account service, later an Orange API) and never assumes a value.
 * The only primary actions are Send and Request, and both only *start* a flow:
 * the flow itself has review and explicit confirmation steps.
 */
export default function OrangeMoneyCard({
  orangeMoneyBalance,
  airtimeBalance,
  dataBalance,
  currency = "SLE",
  loading = false,
  error = null,
  isDemo = false,
  onSend,
  onRequest,
  onRetry,
}) {
  const [hidden, setHidden] = useState(readHiddenPreference);
  const ready = !loading && !error;

  const toggleHidden = () => {
    setHidden((current) => {
      writeHiddenPreference(!current);
      return !current;
    });
  };

  const masked = `${currency} ••••••`;

  const renderBalance = () => {
    if (loading) {
      return <Skeleton width="62%" height={34} radius={10} className="omasta-money-skeleton" />;
    }

    if (error) {
      return <span className="omasta-money-unavailable">Balance unavailable</span>;
    }

    return hidden ? masked : formatMoney(orangeMoneyBalance, currency);
  };

  const renderLine = (value) => {
    if (loading) {
      return <Skeleton width={64} height={14} className="omasta-money-skeleton" />;
    }

    if (error || value === "") {
      return "–";
    }

    return value;
  };

  return (
    <section className="omasta-money-card" aria-labelledby="orange-money-title">
      <div className="omasta-money-top">
        <h2 id="orange-money-title" className="omasta-money-title">
          <span className="omasta-money-mark" aria-hidden="true" />
          Orange Money
        </h2>

        <div className="omasta-money-top-actions">
          {isDemo ? (
            <span className="omasta-money-demo" title="Sample figures for development. Not your real balance.">
              Demo balance
            </span>
          ) : null}
          <button
            type="button"
            className="omasta-money-eye"
            onClick={toggleHidden}
            aria-pressed={hidden}
            aria-label={hidden ? "Show balance" : "Hide balance"}
            disabled={!ready}
          >
            {hidden ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>
      </div>

      <p className="omasta-money-label">Available balance</p>
      <p className="omasta-money-amount" aria-live="polite">
        {renderBalance()}
      </p>

      {error ? (
        <button type="button" className="omasta-money-retry" onClick={onRetry}>
          <RotateCw size={14} />
          Try again
        </button>
      ) : null}

      <div className="omasta-money-actions">
        <button type="button" className="omasta-money-action omasta-money-action--primary" onClick={onSend} disabled={!ready}>
          <ArrowUpRight size={18} />
          Send
        </button>
        <button type="button" className="omasta-money-action" onClick={onRequest} disabled={!ready}>
          <ArrowDownLeft size={18} />
          Request
        </button>
      </div>

      <dl className="omasta-money-lines">
        <div>
          <dt>
            <Smartphone size={14} aria-hidden="true" />
            Airtime
          </dt>
          <dd>{renderLine(hidden ? masked : formatMoney(airtimeBalance, currency))}</dd>
        </div>
        <div>
          <dt>
            <Wifi size={14} aria-hidden="true" />
            Data
          </dt>
          <dd>{renderLine(formatDataAmount(dataBalance))}</dd>
        </div>
      </dl>
    </section>
  );
}
