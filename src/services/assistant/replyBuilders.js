/**
 * Helpers that turn catalogue, location and support records into assistant
 * cards and action buttons. Kept apart from the intent rules so both the local
 * provider and a future model provider can reuse them.
 */

import { ActionType, CardType, createAction, createActionButton, createCard } from "./assistantTypes.js";

export function productCard(product) {
  return createCard(CardType.PRODUCT, {
    productId: product.id,
    title: product.name,
    subtitle: product.category,
    description: product.tagline,
    price: product.price,
    note: product.note,
    art: product.art,
    isDemo: product.isDemo,
    actions: [
      createActionButton({
        label: "View product",
        variant: "primary",
        action: createAction(ActionType.OPEN_PRODUCT, { productId: product.id }),
      }),
      createActionButton({
        label: "Buy",
        action: createAction(ActionType.OPEN_PRODUCT, { productId: product.id, intent: "buy" }),
      }),
    ],
  });
}

export function bundleCard(bundle) {
  return createCard(CardType.BUNDLE, {
    bundleId: bundle.id,
    title: bundle.name,
    subtitle: bundle.validity,
    description: bundle.description,
    price: bundle.price,
    isDemo: bundle.isDemo,
    actions: [
      createActionButton({
        label: "See details",
        variant: "primary",
        action: createAction(ActionType.OPEN_BUNDLE, { bundleId: bundle.id }),
      }),
      createActionButton({
        label: "Activate",
        // Activation spends money, so it is gated behind an explicit confirm.
        action: createAction(ActionType.OPEN_BUNDLE, {
          bundleId: bundle.id,
          intent: "activate",
          requiresConfirmation: true,
        }),
      }),
    ],
  });
}

export function locationCard(location) {
  return createCard(CardType.LOCATION, {
    locationId: location.id,
    title: location.name,
    subtitle: location.type,
    description: location.address,
    distanceLabel: location.distanceLabel,
    openState: location.openState,
    services: location.services,
    isDemo: location.isDemo,
    actions: [
      createActionButton({
        label: "Directions",
        variant: "primary",
        action: createAction(ActionType.DIRECTIONS, { locationId: location.id }),
      }),
      createActionButton({
        label: "Details",
        action: createAction(ActionType.OPEN_LOCATION, { locationId: location.id }),
      }),
    ],
  });
}

export function supportCard(topic, { includeCall = true } = {}) {
  const actions = [
    createActionButton({
      label: "Start troubleshooting",
      variant: "primary",
      action: createAction(ActionType.OPEN_SUPPORT, { topic: topic.id }),
    }),
  ];

  if (includeCall) {
    actions.push(
      createActionButton({
        label: "Call support",
        action: createAction(ActionType.CALL_SUPPORT, { topic: topic.id }),
      })
    );
  }

  return createCard(CardType.SUPPORT, {
    topicId: topic.id,
    title: topic.title,
    description: topic.summary,
    steps: topic.steps.slice(0, 3),
    actions,
  });
}

export function infoCard({ title, description, actions = [] }) {
  return createCard(CardType.INFO, { title, description, actions });
}

export function mapActions(categoryId) {
  return [
    createActionButton({
      label: "View on map",
      variant: "primary",
      action: createAction(ActionType.OPEN_MAP, { category: categoryId }),
    }),
    createActionButton({
      label: "See list",
      action: createAction(ActionType.NAVIGATE, {
        target: "/find",
        params: { category: categoryId, view: "list" },
      }),
    }),
  ];
}

export function locationPermissionActions(categoryId) {
  return [
    createActionButton({
      label: "Use my location",
      variant: "primary",
      action: createAction(ActionType.REQUEST_LOCATION, { category: categoryId }),
    }),
    createActionButton({
      label: "Choose location manually",
      action: createAction(ActionType.CHOOSE_LOCATION, { category: categoryId }),
    }),
  ];
}
