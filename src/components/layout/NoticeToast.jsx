import { CheckCircle2, Info, X } from "lucide-react";

import { useAppUi } from "../../context/AppUiProvider.jsx";

/** Transient confirmation or explanation, anchored above the bottom nav. */
export default function NoticeToast() {
  const { notice, dismissNotice } = useAppUi();

  if (!notice) {
    return null;
  }

  return (
    <div className={`orange-notice orange-notice--${notice.tone}`} role="status">
      {notice.tone === "success" ? <CheckCircle2 size={18} /> : <Info size={18} />}
      <span>{notice.message}</span>
      <button type="button" onClick={dismissNotice} aria-label="Dismiss message">
        <X size={17} />
      </button>
    </div>
  );
}
