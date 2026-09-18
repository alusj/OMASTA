import { CircleCheck, Clock3, Smartphone, X } from "lucide-react";

import { SubmissionStatus, SubmissionStorage } from "../../services/locations/submissionService.js";

const STATUS = {
  [SubmissionStatus.PENDING]: { label: "Pending approval", icon: Clock3 },
  [SubmissionStatus.APPROVED]: { label: "Approved · on the map", icon: CircleCheck },
};

/** The customer's own suggestions, so they can see what is still under review. */
export default function MySubmissionsList({ items, onRemove }) {
  if (!items.length) {
    return null;
  }

  return (
    <section className="omasta-my-submissions" aria-labelledby="my-submissions-title">
      <h2 id="my-submissions-title">Your submissions</h2>
      <ul>
        {items.map((item) => {
          const onDevice = item.storage === SubmissionStorage.DEVICE;
          const status = onDevice
            ? { label: "Saved on this device · not sent", icon: Smartphone }
            : STATUS[item.status] || STATUS[SubmissionStatus.PENDING];
          const Icon = status.icon;

          return (
            <li key={item.id} className={`is-${onDevice ? "device" : item.status}`}>
              <div>
                <strong>{item.name}</strong>
                <small>{item.address}</small>
              </div>
              <span className="omasta-submission-status">
                <Icon size={13} aria-hidden="true" />
                {status.label}
              </span>
              <button type="button" onClick={() => onRemove(item.id)} aria-label={`Hide ${item.name} from this list`}>
                <X size={15} />
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
