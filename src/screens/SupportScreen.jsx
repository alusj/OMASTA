import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ArrowRight, Check, CreditCard, LifeBuoy, MapPin, Phone, Signal, Smartphone, Sparkles, Wallet } from "lucide-react";

import { DemoNote } from "../components/common/DemoBadge.jsx";
import ServiceStatusSection from "../components/home/ServiceStatusSection.jsx";
import SectionHeading from "../components/common/SectionHeading.jsx";
import { findSupportTopic, getSupportPhone, listSupportTopics } from "../services/support/supportService.js";
import { useAppUi } from "../context/AppUiProvider.jsx";
import { useAssistant } from "../context/AssistantProvider.jsx";
import { useAssistantScreenContext } from "../hooks/useAssistantScreenContext.js";

const TOPIC_ICON = {
  sim: CreditCard,
  network: Signal,
  money: Wallet,
  account: LifeBuoy,
  device: Smartphone,
};

/** Support: self-help topics, guided help through the assistant, escalation. */
export default function SupportScreen() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { openSupportSheet, showNotice } = useAppUi();
  const { openAssistant } = useAssistant();

  const topicId = searchParams.get("topic");
  const [expandedId, setExpandedId] = useState(topicId);
  const topics = useMemo(() => listSupportTopics(), []);
  const phone = getSupportPhone();

  useAssistantScreenContext({ screen: "support", focus: { topic: topicId } }, [topicId]);

  useEffect(() => {
    if (!topicId) {
      return;
    }

    setExpandedId(topicId);

    const node = document.getElementById(`support-topic-${topicId}`);
    node?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [topicId]);

  const toggleTopic = (id) => {
    const next = expandedId === id ? null : id;
    setExpandedId(next);

    const params = new URLSearchParams(searchParams);

    if (next) {
      params.set("topic", next);
    } else {
      params.delete("topic");
    }

    setSearchParams(params, { replace: true });
  };

  const activeTopic = topicId ? findSupportTopic(topicId) : null;

  return (
    <section className="orange-page-section" aria-labelledby="support-title">
      <div className="orange-page-intro">
        <p className="orange-eyebrow">Orange support</p>
        <h1 id="support-title">We are here when you need us</h1>
        <p>Start with OMASTA AI, work through it yourself, or go straight to Orange.</p>
      </div>

      <div className="omasta-support-primary">
        <button type="button" className="omasta-support-primary-card" onClick={() => openAssistant()}>
          <span className="omasta-support-primary-icon">
            <Sparkles size={20} />
          </span>
          <div>
            <strong>Chat with OMASTA AI</strong>
            <small>
              {activeTopic ? `Start with ${activeTopic.title.toLowerCase()}` : "Describe the problem in your own words"}
            </small>
          </div>
          <ArrowRight size={17} />
        </button>

        <button
          type="button"
          className="omasta-support-primary-card"
          onClick={() => {
            if (phone) {
              window.location.href = `tel:${phone.replace(/\s+/g, "")}`;
              return;
            }

            openSupportSheet(topicId);
            showNotice("The customer care number is not configured in this build yet.");
          }}
        >
          <span className="omasta-support-primary-icon">
            <Phone size={20} />
          </span>
          <div>
            <strong>Call customer care</strong>
            <small>{phone ? `Dial ${phone}` : "Number not configured yet"}</small>
          </div>
          <ArrowRight size={17} />
        </button>

        <button
          type="button"
          className="omasta-support-primary-card"
          onClick={() => navigate("/find?category=support&view=map")}
        >
          <span className="omasta-support-primary-icon">
            <MapPin size={20} />
          </span>
          <div>
            <strong>Visit a service centre</strong>
            <small>In-person help near you</small>
          </div>
          <ArrowRight size={17} />
        </button>
      </div>

      <SectionHeading eyebrow="Self help" title="Common topics" />

      <div className="omasta-topic-list">
        {topics.map((topic) => {
          const Icon = TOPIC_ICON[topic.id] || LifeBuoy;
          const isOpen = expandedId === topic.id;

          return (
            <article
              className={`omasta-topic ${isOpen ? "is-open" : ""}`}
              key={topic.id}
              id={`support-topic-${topic.id}`}
            >
              <button
                type="button"
                className="omasta-topic-head"
                aria-expanded={isOpen}
                onClick={() => toggleTopic(topic.id)}
              >
                <span className="orange-icon-box">
                  <Icon size={19} />
                </span>
                <span>
                  <strong>{topic.title}</strong>
                  <small>{topic.summary}</small>
                </span>
                <ArrowRight size={17} className="omasta-topic-chevron" />
              </button>

              {isOpen ? (
                <div className="omasta-topic-body">
                  <ol>
                    {topic.steps.map((step) => (
                      <li key={step}>
                        <Check size={14} />
                        <span>{step}</span>
                      </li>
                    ))}
                  </ol>
                  <p className="omasta-topic-escalation">{topic.escalation}</p>
                  <div className="omasta-topic-actions">
                    <button
                      type="button"
                      className="omasta-ask-ai-button"
                      onClick={() => openAssistant({ prompt: `I need help with ${topic.title.toLowerCase()}` })}
                    >
                      <Sparkles size={15} />
                      Walk me through it
                    </button>
                    <button
                      type="button"
                      className="orange-button orange-button--outline"
                      onClick={() => openSupportSheet(topic.id)}
                    >
                      More options
                    </button>
                  </div>
                </div>
              ) : null}
            </article>
          );
        })}
      </div>

      <SectionHeading eyebrow="Service status" title="How things are running" />
      <ServiceStatusSection onReportProblem={() => openAssistant({ prompt: "I want to report a network problem" })} />

      <DemoNote>
        Support guidance here is general. Anything specific to your line, balance or billing needs Orange customer care
        or a signed-in account API.
      </DemoNote>
    </section>
  );
}
