"use client";

import { createContext, useContext, useMemo, useReducer } from "react";
import {
  MIN_INTERVENTION_NOTE,
  MIN_OVERRIDE_REASON,
  PATIENT,
  REVIEW_CHECKLIST,
  STAFF,
  STATUS,
  STATUS_LABEL,
  describeOrder,
} from "./demoData";
import { evaluateOrder } from "./rules";

export function createInitialState(session = 1) {
  return { session, orders: [], audit: [], seq: { order: 0, alert: 0, event: 0, intervention: 0 } };
}

const pad = (n) => String(n).padStart(4, "0");
const isOpen = (o) => o.status !== STATUS.REVIEWED && o.status !== STATUS.DISCONTINUED;
const canHold = (o) => o.status === STATUS.PENDING || o.status === STATUS.REQUIRES_REVIEW;

function cleanFields(fields) {
  const f = {
    medication: String(fields?.medication || "").trim(),
    dose: String(fields?.dose || "").trim(),
    route: String(fields?.route || "").trim(),
    frequency: String(fields?.frequency || "").trim(),
  };
  return f.medication && f.dose && f.route && f.frequency ? f : null;
}

function addEvent(draft, at, event) {
  draft.seq.event += 1;
  draft.audit.push({ id: `EVT-${pad(draft.seq.event)}`, at, ...event });
}

function setStatus(draft, at, order, to, note) {
  // Safety guard: an order carrying an allergy alert can never become "Reviewed".
  if (to === STATUS.REVIEWED && order.alert) return false;
  const from = order.status;
  order.status = to;
  addEvent(draft, at, {
    actor: "system",
    type: "status",
    orderId: order.id,
    title: from
      ? `Status changed: ${STATUS_LABEL[from]} to ${STATUS_LABEL[to]}`
      : `Status set: ${STATUS_LABEL[to]}`,
    detail: note || "",
    from,
    to,
  });
  return true;
}

function createOrder(draft, at, fields, revisesId = null) {
  draft.seq.order += 1;
  const { checks, match } = evaluateOrder(fields, PATIENT);
  const order = {
    id: `ORD-${pad(draft.seq.order)}`,
    ...fields,
    submittedAt: at,
    prescriber: STAFF.physician.name,
    status: null,
    checks,
    alert: null,
    heldBy: null,
    prescriberContactedAt: null,
    interventions: [],
    revisesId,
    revisedById: null,
    review: null,
  };
  if (match) {
    draft.seq.alert += 1;
    order.alert = { id: `ALT-${pad(draft.seq.alert)}`, ...match, raisedAt: at, response: null };
  }
  draft.orders.push(order);

  addEvent(draft, at, {
    actor: "physician",
    type: revisesId ? "revised" : "order_submitted",
    orderId: order.id,
    title: revisesId ? "Revised order submitted by prescriber" : "Medication order submitted",
    detail: revisesId
      ? `Replaces ${revisesId}. ${describeOrder(order)}.`
      : `${describeOrder(order)} for ${PATIENT.name} (${PATIENT.id}).`,
  });

  if (revisesId) {
    const original = draft.orders.find((o) => o.id === revisesId);
    original.revisedById = order.id;
    setStatus(draft, at, original, STATUS.DISCONTINUED, `Replaced by revised order ${order.id}.`);
  }

  if (order.alert) {
    addEvent(draft, at, {
      actor: "system",
      type: "alert",
      orderId: order.id,
      title: "High-priority allergy alert generated",
      detail: `${order.alert.id}: ${order.alert.explanation}`,
    });
    setStatus(draft, at, order, STATUS.PENDING, "Alert active. Waiting for the prescriber to respond.");
  } else {
    addEvent(draft, at, {
      actor: "system",
      type: "check_clear",
      orderId: order.id,
      title: "Demo check completed, no configured rule matched",
      detail: "No match is not a statement of safety. Pharmacist review is still required.",
    });
    setStatus(
      draft,
      at,
      order,
      revisesId ? STATUS.REQUIRES_REVIEW : STATUS.PENDING,
      revisesId ? "Revised order sent to the pharmacist for review." : "Waiting for pharmacist review."
    );
  }
  return order;
}

function apply(draft, action) {
  const at = action.at;
  const order = action.orderId ? draft.orders.find((o) => o.id === action.orderId) : null;

  switch (action.type) {
    case "SUBMIT_ORDER": {
      const fields = cleanFields(action.fields);
      if (!fields) return false;
      createOrder(draft, at, fields);
      return true;
    }

    case "HOLD_ORDER": {
      if (!order || !canHold(order)) return false;
      if (action.by === "physician") {
        if (!order.alert || order.alert.response) return false;
        order.alert.response = { type: "HOLD", at, by: STAFF.physician.name };
        order.heldBy = "physician";
        addEvent(draft, at, {
          actor: "physician",
          type: "hold",
          orderId: order.id,
          title: "Order placed on hold by prescriber",
          detail: `Prescriber accepted alert ${order.alert.id} and held the order.`,
        });
      } else {
        order.heldBy = "pharmacist";
        addEvent(draft, at, {
          actor: "pharmacist",
          type: "hold",
          orderId: order.id,
          title: "Order placed on hold by pharmacist",
          detail: "The order will not move to dispensing while it is on hold.",
        });
      }
      return setStatus(draft, at, order, STATUS.ON_HOLD, "Order cannot proceed until it is resolved.");
    }

    case "OVERRIDE_ALERT": {
      const reason = String(action.reason || "").trim();
      if (!order || order.status !== STATUS.PENDING) return false;
      if (!order.alert || order.alert.response) return false;
      if (reason.length < MIN_OVERRIDE_REASON) return false;
      order.alert.response = { type: "OVERRIDE", reason, at, by: STAFF.physician.name };
      addEvent(draft, at, {
        actor: "physician",
        type: "override",
        orderId: order.id,
        title: "Allergy alert overridden by prescriber",
        detail: `Reason given: "${reason}"`,
      });
      return setStatus(
        draft,
        at,
        order,
        STATUS.REQUIRES_REVIEW,
        "Sent to the pharmacist review queue. The allergy warning stays attached."
      );
    }

    case "RECORD_INTERVENTION": {
      const note = String(action.note || "").trim();
      if (!order || !isOpen(order) || note.length < MIN_INTERVENTION_NOTE) return false;
      draft.seq.intervention += 1;
      const kind = action.kind || "Other";
      order.interventions.push({
        id: `INT-${pad(draft.seq.intervention)}`,
        kind,
        note,
        at,
        by: STAFF.pharmacist.name,
      });
      addEvent(draft, at, {
        actor: "pharmacist",
        type: "intervention",
        orderId: order.id,
        title: "Pharmacist intervention recorded",
        detail: `${kind}: ${note}`,
      });
      return true;
    }

    case "CONTACT_PRESCRIBER": {
      if (!order || !isOpen(order) || order.prescriberContactedAt) return false;
      order.prescriberContactedAt = at;
      addEvent(draft, at, {
        actor: "pharmacist",
        type: "contact",
        orderId: order.id,
        title: "Prescriber contacted (simulated)",
        detail: `${STAFF.pharmacist.name} contacted ${order.prescriber} about ${order.id}. The prescriber acknowledged and will reassess the order.`,
      });
      return true;
    }

    case "SUBMIT_REVISED": {
      const fields = cleanFields(action.fields);
      if (!order || !isOpen(order) || !order.prescriberContactedAt || !fields) return false;
      createOrder(draft, at, fields, order.id);
      return true;
    }

    case "MARK_REVIEWED": {
      if (!order || action.checklistConfirmed !== true) return false;
      if (order.alert) return false; // never mark a flagged order as reviewed
      if (order.status !== STATUS.PENDING && order.status !== STATUS.REQUIRES_REVIEW) return false;
      order.review = { at, by: STAFF.pharmacist.name, checklist: REVIEW_CHECKLIST };
      addEvent(draft, at, {
        actor: "pharmacist",
        type: "review",
        orderId: order.id,
        title: "Pharmacist review recorded",
        detail: `Checklist completed by ${STAFF.pharmacist.name}: ${REVIEW_CHECKLIST.join("; ")}.`,
      });
      return setStatus(draft, at, order, STATUS.REVIEWED, "Review documented by the pharmacist.");
    }

    default:
      return false;
  }
}

export function reducer(state, action) {
  if (action.type === "RESET") return createInitialState(state.session + 1);
  if (action.type === "SEQUENCE") {
    // Runs several actions in order. Each step looks at the latest state and
    // returns an action, or null to skip when its precondition is not met.
    return action.steps.reduce((s, make) => {
      const next = make(s);
      return next ? reducer(s, { ...next, at: action.at }) : s;
    }, state);
  }
  const draft = structuredClone(state);
  return apply(draft, action) ? draft : state;
}

const StoreContext = createContext(null);

export function StoreProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, undefined, () => createInitialState());

  const actions = useMemo(() => {
    const send = (action) => dispatch({ ...action, at: Date.now() });
    return {
      submitOrder: (fields) => send({ type: "SUBMIT_ORDER", fields }),
      holdOrder: (orderId, by) => send({ type: "HOLD_ORDER", orderId, by }),
      overrideAlert: (orderId, reason) => send({ type: "OVERRIDE_ALERT", orderId, reason }),
      recordIntervention: (orderId, kind, note) =>
        send({ type: "RECORD_INTERVENTION", orderId, kind, note }),
      contactPrescriber: (orderId) => send({ type: "CONTACT_PRESCRIBER", orderId }),
      submitRevised: (orderId, fields) => send({ type: "SUBMIT_REVISED", orderId, fields }),
      markReviewed: (orderId) => send({ type: "MARK_REVIEWED", orderId, checklistConfirmed: true }),
      runSequence: (steps) => send({ type: "SEQUENCE", steps }),
      reset: () => dispatch({ type: "RESET" }),
    };
  }, []);

  const value = useMemo(() => ({ state, actions }), [state, actions]);
  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used inside StoreProvider");
  return ctx;
}

// Derived counts shared by the navigation and the panels.
export function selectCounts(state) {
  const by = (s) => state.orders.filter((o) => o.status === s).length;
  return {
    unanswered: state.orders.filter(
      (o) => o.alert && !o.alert.response && o.status === STATUS.PENDING
    ).length,
    queue: state.orders.filter((o) => isOpen(o)).length,
    pending: by(STATUS.PENDING),
    onHold: by(STATUS.ON_HOLD),
    requiresReview: by(STATUS.REQUIRES_REVIEW),
    reviewed: by(STATUS.REVIEWED),
    events: state.audit.length,
  };
}
