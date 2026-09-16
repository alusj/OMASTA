import { ArrowRight, Construction } from "lucide-react";

import BottomSheet from "../common/BottomSheet.jsx";
import { PLACEHOLDER_FLOWS } from "../../data/quickActions.js";
import { useAppUi } from "../../context/AppUiProvider.jsx";
import { useAssistant } from "../../context/AssistantProvider.jsx";

/**
 * Explains a capability that is not built yet and offers a route that does
 * work today. This is what quick actions open instead of doing nothing, and it
 * is honest about why the flow is unavailable.
 */
export default function PlaceholderSheet() {
  const { placeholderId, closePlaceholder } = useAppUi();
  const { runAction } = useAssistant();
  const flow = placeholderId ? PLACEHOLDER_FLOWS[placeholderId] : null;

  if (!flow) {
    return null;
  }

  const handle = (action) => {
    closePlaceholder();
    runAction(action);
  };

  return (
    <BottomSheet
      open={Boolean(placeholderId)}
      onClose={closePlaceholder}
      eyebrow={flow.summary}
      title={flow.title}
      labelledById="placeholder-title"
    >
      <div className="omasta-placeholder">
        <p className="omasta-placeholder-body">
          <Construction size={18} />
          <span>{flow.body}</span>
        </p>

        <div className="omasta-placeholder-actions">
          <button type="button" className="orange-button orange-button--solid" onClick={() => handle(flow.primary.action)}>
            {flow.primary.label}
            <ArrowRight size={15} />
          </button>
          <button type="button" className="omasta-ask-ai-button" onClick={() => handle(flow.secondary.action)}>
            {flow.secondary.label}
          </button>
        </div>
      </div>
    </BottomSheet>
  );
}
