import { AlertTriangle, CircleCheck, CircleHelp, TriangleAlert } from "lucide-react";

import { getServiceStatus } from "../../services/status/statusService.js";
import { DemoNote } from "../common/DemoBadge.jsx";

const STATE_ICON = {
  operational: CircleCheck,
  degraded: TriangleAlert,
  down: AlertTriangle,
  unknown: CircleHelp,
};

/**
 * Compact service status strip.
 *
 * `statusService` reports whether the data is live. While it is not, the strip
 * is explicitly labelled as sample data rather than implying a real reading.
 */
export default function ServiceStatusSection({ onReportProblem }) {
  const { services, disclaimer, isLive } = getServiceStatus();

  return (
    <div className="omasta-status-panel">
      <ul className="omasta-status-list">
        {services.map((service) => {
          const Icon = STATE_ICON[service.state] || CircleHelp;

          return (
            <li key={service.id} className={`omasta-status-item omasta-status-item--${service.state}`}>
              <Icon size={16} />
              <div>
                <strong>{service.label}</strong>
                <small>{isLive ? service.detail : "Sample status"}</small>
              </div>
            </li>
          );
        })}
      </ul>

      {!isLive ? <DemoNote>{disclaimer}</DemoNote> : null}

      <button type="button" className="omasta-status-report" onClick={onReportProblem}>
        Report a problem
      </button>
    </div>
  );
}
