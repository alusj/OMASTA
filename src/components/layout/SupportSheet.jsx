import { useNavigate } from "react-router-dom";
import { ArrowRight, CreditCard, MapPin, MessageSquare, Phone, TriangleAlert } from "lucide-react";

import BottomSheet from "../common/BottomSheet.jsx";
import { useAppUi } from "../../context/AppUiProvider.jsx";
import { useAssistant } from "../../context/AssistantProvider.jsx";
import { buildCallHref, getSupportPhone } from "../../services/support/supportService.js";

/** The support sheet opened from the header's call icon and from screens. */
export default function SupportSheet() {
  const navigate = useNavigate();
  const { supportOpen, supportTopic, closeSupportSheet, showNotice } = useAppUi();
  const { openAssistant } = useAssistant();
  const phone = getSupportPhone();

  const go = (path) => {
    closeSupportSheet();
    navigate(path);
  };

  const callCustomerCare = () => {
    if (!phone) {
      showNotice("The customer care number is not configured in this build yet.");
      return;
    }

    window.location.href = buildCallHref(phone);
  };

  const options = [
    {
      id: "call",
      label: "Call customer care",
      detail: phone ? `Dial ${phone}` : "Number not configured in this build",
      icon: Phone,
      primary: true,
      onSelect: callCustomerCare,
      disabled: !phone,
    },
    {
      id: "chat",
      label: "Chat with OMASTA AI",
      detail: "Get an answer or a next step straight away",
      icon: MessageSquare,
      onSelect: () => {
        closeSupportSheet();
        openAssistant(supportTopic ? { prompt: `I need help with ${supportTopic}` } : {});
      },
    },
    {
      id: "office",
      label: "Find an Orange office",
      detail: "Shops and service centres near you",
      icon: MapPin,
      onSelect: () => go("/find?category=support&view=map"),
    },
    {
      id: "report",
      label: "Report a problem",
      detail: "Network, data or service issue",
      icon: TriangleAlert,
      onSelect: () => go("/support?topic=network"),
    },
    {
      id: "sim",
      label: "SIM assistance",
      detail: "Registration, replacement or eSIM",
      icon: CreditCard,
      onSelect: () => go("/support?topic=sim"),
    },
  ];

  return (
    <BottomSheet
      open={supportOpen}
      onClose={closeSupportSheet}
      eyebrow="Orange support"
      title="How can we help?"
      description="Pick the route that suits you and we will take it from there."
      labelledById="support-sheet-title"
    >
      <div className="omasta-support-options">
        {options.map((option) => (
          <button
            type="button"
            key={option.id}
            className={`orange-support-choice ${option.primary ? "orange-support-choice--primary" : ""}`}
            onClick={option.onSelect}
          >
            <span>
              <option.icon size={19} />
            </span>
            <div>
              <strong>{option.label}</strong>
              <small>{option.detail}</small>
            </div>
            <ArrowRight size={17} />
          </button>
        ))}
      </div>
    </BottomSheet>
  );
}
