import { getServiceIcon } from "../services/serviceIcons.js";

/**
 * The four Home services. Compact icon buttons in one row on phones, labelled
 * tiles on wider screens. The full directory lives on /services.
 */
export default function OrangeServicesRow({ services, onSelect }) {
  return (
    <ul className="omasta-services-row">
      {services.map((service) => {
        const Icon = getServiceIcon(service.icon);

        return (
          <li key={service.id}>
            <button type="button" className="omasta-service-button" onClick={() => onSelect(service)}>
              <span className="omasta-service-icon" aria-hidden="true">
                <Icon size={20} />
              </span>
              <span className="omasta-service-text">
                <span className="omasta-service-label">{service.label}</span>
                <span className="omasta-service-detail">{service.detail}</span>
              </span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
