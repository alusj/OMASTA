import { useNavigate } from "react-router-dom";
import { ArrowLeft, ChevronRight } from "lucide-react";

import { getServiceIcon } from "../components/services/serviceIcons.js";
import { getServicesByGroup } from "../data/orangeServices.js";
import { useAssistant } from "../context/AssistantProvider.jsx";
import { useAssistantScreenContext } from "../hooks/useAssistantScreenContext.js";

const GROUPS = getServicesByGroup();

/**
 * All Orange services ("View all" from Home). Every tile runs through the
 * shared action dispatcher, exactly like the Home shortcuts and OMASTA AI.
 */
export default function ServicesScreen() {
  const navigate = useNavigate();
  const { runAction } = useAssistant();

  useAssistantScreenContext({ screen: "services" }, []);

  return (
    <section className="orange-page-section" aria-labelledby="services-title">
      <button type="button" className="omasta-back-button" onClick={() => navigate(-1)}>
        <ArrowLeft size={16} />
        Back
      </button>

      <div className="orange-page-intro">
        <p className="orange-eyebrow">Orange services</p>
        <h1 id="services-title">Everything Orange</h1>
        <p>Data, airtime, Orange Money and help for your line, in one place.</p>
      </div>

      {GROUPS.map((group) => (
        <div className="omasta-services-group" key={group.id}>
          <h2>{group.label}</h2>
          <ul className="omasta-services-list">
            {group.services.map((service) => {
              const Icon = getServiceIcon(service.icon);

              return (
                <li key={service.id}>
                  <button type="button" className="omasta-services-item" onClick={() => runAction(service.action)}>
                    <span className="omasta-service-icon" aria-hidden="true">
                      <Icon size={19} />
                    </span>
                    <span className="omasta-services-item-copy">
                      <strong>{service.title}</strong>
                      <small>{service.detail}</small>
                    </span>
                    <ChevronRight size={17} aria-hidden="true" />
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </section>
  );
}
