/**
 * Support service.
 *
 * Serves self-help topics and guided troubleshooting steps. Nothing here reads
 * or asserts anything about a specific customer account: that requires a real
 * Orange support API and an authenticated session.
 */

import { SUPPORT_TOPICS, TROUBLESHOOTING_FLOWS } from "../../data/supportTopics.js";
import { SUPPORT_PHONE } from "../../config/env.js";

export function listSupportTopics() {
  return SUPPORT_TOPICS;
}

export function findSupportTopic(topicId) {
  return SUPPORT_TOPICS.find((topic) => topic.id === topicId) || null;
}

export function getFlow(flowId) {
  return TROUBLESHOOTING_FLOWS[flowId] || null;
}

export function getFlowStep(flowId, stepIndex) {
  const flow = getFlow(flowId);

  if (!flow || stepIndex >= flow.steps.length) {
    return null;
  }

  return flow.steps[stepIndex];
}

/**
 * Customer care number. Returns null when it has not been configured, so the UI
 * can say so instead of dialling an invented number.
 */
export function getSupportPhone() {
  return SUPPORT_PHONE ? SUPPORT_PHONE.trim() : null;
}

export function buildCallHref(phone) {
  return `tel:${phone.replace(/\s+/g, "")}`;
}
