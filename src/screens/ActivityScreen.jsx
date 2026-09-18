import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

import { DemoNote } from "../components/common/DemoBadge.jsx";
import RecentActivityList from "../components/home/RecentActivityList.jsx";
import { listRecentActivity } from "../services/account/accountService.js";
import { useAssistantScreenContext } from "../hooks/useAssistantScreenContext.js";
import { useServiceResource } from "../hooks/useServiceResource.js";

/** Full activity feed ("See all" from Home). */
export default function ActivityScreen() {
  const navigate = useNavigate();
  const activity = useServiceResource(listRecentActivity);

  useAssistantScreenContext({ screen: "account" }, []);

  return (
    <section className="orange-page-section" aria-labelledby="activity-title">
      <button type="button" className="omasta-back-button" onClick={() => navigate(-1)}>
        <ArrowLeft size={16} />
        Back
      </button>

      <div className="orange-page-intro">
        <p className="orange-eyebrow">Your account</p>
        <h1 id="activity-title">Recent activity</h1>
        <p>Bundles, airtime and Orange Money on your line.</p>
      </div>

      <div className="omasta-activity-page">
        <RecentActivityList
          items={activity.data}
          loading={activity.loading}
          error={activity.error}
          onRetry={activity.reload}
          skeletonCount={5}
        />
      </div>

      <DemoNote>
        These are demo transactions for design review, not your real activity. Your actual history will appear here once
        the Orange transactions API is connected.
      </DemoNote>
    </section>
  );
}
