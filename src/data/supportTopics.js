/**
 * Support topics and troubleshooting scripts.
 *
 * The guidance is generic telecom self-help. It never claims anything about a
 * specific account, balance or network state. Anything account specific must
 * come from a real Orange support/account API.
 */

export const SUPPORT_TOPICS = [
  {
    id: "sim",
    title: "SIM and eSIM",
    summary: "SIM not detected, registration, replacement and eSIM activation.",
    icon: "sim",
    steps: [
      "Power the phone off, reseat the SIM, then power it back on.",
      "Try the SIM in another handset to see whether the issue follows the SIM or the phone.",
      "Check that the line is registered. Registration is completed at an Orange shop or authorised agent with a valid ID.",
      "If the SIM is damaged or still not detected, a replacement is issued at an Orange shop or authorised agent.",
    ],
    escalation: "If these steps do not help, customer care or an Orange shop can check the line itself.",
  },
  {
    id: "network",
    title: "Network and data",
    summary: "No signal, slow browsing or a connection that keeps dropping.",
    icon: "network",
    steps: [
      "Toggle flight mode on and off to force the handset to reselect the network.",
      "Check the network mode setting is set to automatic rather than locked to one technology.",
      "Move to an open area, since indoor coverage can be weaker.",
      "Restart the device, then test again in a different location.",
    ],
    escalation: "If the problem continues in more than one location, report it so it can be investigated.",
  },
  {
    id: "money",
    title: "Orange Money",
    summary: "Transfers, cash in, cash out and payment questions.",
    icon: "money",
    steps: [
      "Confirm the recipient number before sending any transfer.",
      "Keep the confirmation message for every transaction as your record.",
      "For cash in and cash out, use an Orange Money point or an authorised agent.",
      "Never share your PIN with anyone, including someone claiming to be Orange staff.",
    ],
    escalation: "Transaction disputes must be raised with Orange Money support directly.",
  },
  {
    id: "account",
    title: "Account and billing",
    summary: "Your number, plan, balance and billing questions.",
    icon: "account",
    steps: [
      "Have your Orange number and registered ID ready before you call or visit.",
      "Note the date and time of anything you want reviewed.",
      "For plan or tariff changes, an Orange shop or customer care can confirm what applies to your line.",
    ],
    escalation: "Balance, usage and billing details can only be confirmed by Orange on your registered line.",
  },
  {
    id: "device",
    title: "Devices",
    summary: "Phones, routers and MiFi setup or repair.",
    icon: "device",
    steps: [
      "Restart the device and check it is charged.",
      "For a router or MiFi, confirm a valid data plan is active on the SIM inside it.",
      "Check the Wi-Fi name and password on the label of the device.",
      "For hardware faults, a service centre can inspect the device.",
    ],
    escalation: "A service centre handles repairs and warranty questions.",
  },
];

/**
 * Short guided flows the assistant can run before escalating.
 * Each step asks one question and offers quick replies.
 */
export const TROUBLESHOOTING_FLOWS = {
  sim: {
    id: "sim",
    title: "SIM troubleshooting",
    steps: [
      {
        id: "detect",
        question: "Let us narrow it down. Does your phone show the SIM at all, or does it say no SIM?",
        replies: [
          { label: "It says no SIM", value: "no sim detected" },
          { label: "SIM shows, no service", value: "sim shows but no service" },
        ],
      },
      {
        id: "other-phone",
        question:
          "Thanks. Power the phone off, reseat the SIM and power it on again. If you can, try the SIM in another phone. Did that change anything?",
        replies: [
          { label: "Still not working", value: "still not working" },
          { label: "It works now", value: "it works now" },
        ],
      },
    ],
  },
  network: {
    id: "network",
    title: "Network troubleshooting",
    steps: [
      {
        id: "scope",
        question: "Is the problem in one place only, or everywhere you go?",
        replies: [
          { label: "One place only", value: "only in one place" },
          { label: "Everywhere", value: "everywhere i go" },
        ],
      },
      {
        id: "toggle",
        question:
          "Please turn flight mode on, wait ten seconds, then turn it off so the phone reselects the network. Is it any better?",
        replies: [
          { label: "Still bad", value: "still bad" },
          { label: "Better now", value: "better now" },
        ],
      },
    ],
  },
};
