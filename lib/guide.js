// Guided demonstration scripts.
// Each step names the panel to show, what to say, and the actions to run when
// the presenter moves to that step. Actions look at the current state and
// return null when their precondition is not met, so a step is safe to run
// even if the presenter clicked something by hand.

import { EXAMPLE_ORDER, PLACEHOLDER_REVISED_ORDER, STATUS } from "./demoData";

const openOrder = (s) =>
  [...s.orders].reverse().find((o) => o.status !== STATUS.REVIEWED && o.status !== STATUS.DISCONTINUED);
const holdable = (o) => o.status === STATUS.PENDING || o.status === STATUS.REQUIRES_REVIEW;

const submitExample = (s) =>
  s.orders.length === 0 ? { type: "SUBMIT_ORDER", fields: EXAMPLE_ORDER } : null;

const physicianHold = (s) => {
  const o = openOrder(s);
  return o && o.alert && !o.alert.response && holdable(o)
    ? { type: "HOLD_ORDER", orderId: o.id, by: "physician" }
    : null;
};

const physicianOverride = (s) => {
  const o = openOrder(s);
  return o && o.alert && !o.alert.response && o.status === STATUS.PENDING
    ? {
        type: "OVERRIDE_ALERT",
        orderId: o.id,
        reason: "Demonstration reason: prescriber believes the allergy record may be out of date.",
      }
    : null;
};

const pharmacistHold = (s) => {
  const o = openOrder(s);
  return o && o.alert && holdable(o) ? { type: "HOLD_ORDER", orderId: o.id, by: "pharmacist" } : null;
};

const intervention = (s) => {
  const o = openOrder(s);
  return o && o.alert && o.interventions.length === 0
    ? {
        type: "RECORD_INTERVENTION",
        orderId: o.id,
        kind: "Allergy alert follow-up",
        note: "Documented penicillin allergy conflicts with this order. Order not released. Prescriber to reassess.",
      }
    : null;
};

const contact = (s) => {
  const o = openOrder(s);
  return o && o.alert && !o.prescriberContactedAt ? { type: "CONTACT_PRESCRIBER", orderId: o.id } : null;
};

const revised = (s) => {
  const o = openOrder(s);
  return o && o.alert && o.prescriberContactedAt
    ? { type: "SUBMIT_REVISED", orderId: o.id, fields: PLACEHOLDER_REVISED_ORDER }
    : null;
};

const review = (s) => {
  const o = openOrder(s);
  return o && !o.alert && holdable(o)
    ? { type: "MARK_REVIEWED", orderId: o.id, checklistConfirmed: true }
    : null;
};

const opening = [
  {
    title: "Meet the patient",
    panel: "doctor",
    say: "Mr. Ahmed is 58 and has a documented penicillin allergy. The physician is about to order amoxicillin for him.",
    run: [],
  },
  {
    title: "The physician submits the order",
    panel: "cdss",
    say: "The order is typed, complete and legible. The moment it is submitted, the system checks it against the patient record and stops the prescriber with an alert.",
    run: [submitExample],
  },
  {
    title: "Ask the class",
    panel: "cdss",
    ask: "Imagine you are the hospital pharmacist. Would you allow this order to go ahead?",
    say: "Take two or three answers before moving on.",
    run: [],
  },
];

const closing = [
  {
    title: "The prescriber sends a revised order",
    panel: "pharmacist",
    say: "The original order is discontinued and a revised one arrives. The simulation uses a placeholder on purpose: choosing the therapy is the prescriber's clinical decision, not the software's.",
    run: [revised],
  },
  {
    title: "The pharmacist reviews the revised order",
    panel: "pharmacist",
    say: "The revised order is checked again and still needs a pharmacist's sign-off. Only a documented review moves it to Reviewed.",
    run: [review],
  },
  {
    title: "Read the audit trail",
    panel: "audit",
    say: "Every step is timestamped and attributed: who ordered, what the system flagged, who responded and why. CPOE supports medication safety, and the pharmacist's judgement completes it.",
    run: [],
  },
];

export const SCENARIOS = {
  hold: {
    id: "hold",
    name: "Scenario A",
    title: "The alert is heeded",
    summary:
      "The physician holds the order, the pharmacist intervenes and a revised order is reviewed. Shows CPOE working as intended.",
    steps: [
      ...opening,
      {
        title: "The physician holds the order",
        panel: "cdss",
        say: "The prescriber accepts the alert. The order is on hold and cannot reach dispensing. The warning stays on the order.",
        run: [physicianHold],
      },
      {
        title: "The pharmacist intervenes",
        panel: "pharmacist",
        say: "The pharmacist sees the held order with its warning, documents an intervention and contacts the prescriber.",
        run: [intervention, contact],
      },
      ...closing,
    ],
  },
  override: {
    id: "override",
    name: "Scenario B",
    title: "The alert is overridden",
    summary:
      "The physician overrides the alert with a reason and the pharmacist becomes the safety net. Shows the limits of CPOE and alert fatigue.",
    steps: [
      ...opening,
      {
        title: "The physician overrides the alert",
        panel: "cdss",
        say: "The system demands a reason, but it cannot stop the override. This is the limit of CPOE: an alert only works if someone acts on it.",
        run: [physicianOverride],
      },
      {
        title: "The order reaches the pharmacist",
        panel: "pharmacist",
        say: "The order arrives as Requires review with the allergy warning and the override reason attached. When clinicians see too many alerts they start to click past them. That is alert fatigue.",
        run: [],
      },
      {
        title: "The pharmacist holds and intervenes",
        panel: "pharmacist",
        say: "The pharmacist places the order on hold, documents the intervention and contacts the prescriber.",
        run: [pharmacistHold, intervention, contact],
      },
      ...closing,
    ],
  },
};
