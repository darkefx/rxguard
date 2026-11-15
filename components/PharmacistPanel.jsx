"use client";

import { useEffect, useState } from "react";
import {
  Ban,
  Check,
  CircleCheck,
  CirclePause,
  ClipboardCheck,
  FilePenLine,
  Lock,
  MessageSquareText,
  PhoneCall,
  Pill,
  ScanSearch,
  ShieldAlert,
  Stethoscope,
  TriangleAlert,
} from "lucide-react";
import {
  FREQUENCIES,
  INTERVENTION_TYPES,
  MIN_INTERVENTION_NOTE,
  PATIENT,
  PLACEHOLDER_REVISED_ORDER,
  REVIEW_CHECKLIST,
  ROUTES,
  STAFF,
  STATUS,
  describeOrder,
  formatTime,
} from "@/lib/demoData";
import { selectCounts, useStore } from "@/lib/store";
import {
  Button,
  Card,
  EmptyState,
  OrderId,
  PanelHeading,
  PatientStrip,
  SelectField,
  StatusPill,
  TextArea,
  TextField,
  useUi,
} from "./ui";

const isOpen = (o) => o.status !== STATUS.REVIEWED && o.status !== STATUS.DISCONTINUED;
const canHold = (o) => o.status === STATUS.PENDING || o.status === STATUS.REQUIRES_REVIEW;

export default function PharmacistPanel() {
  const { state } = useStore();
  const { goTo } = useUi();
  const orders = state.orders;
  const counts = selectCounts(state);
  const [selectedId, setSelectedId] = useState(null);

  useEffect(() => setSelectedId(null), [orders.length]);

  const order = orders.find((o) => o.id === selectedId) ?? orders[orders.length - 1];

  return (
    <div>
      <PanelHeading title="Pharmacist panel">
        The hospital pharmacist sees every submitted order with its warnings, documents
        interventions, contacts the prescriber and records the review.
      </PanelHeading>
      <PatientStrip patient={PATIENT} />

      {!order ? (
        <EmptyState
          icon={Pill}
          title="The order queue is empty"
          action={
            <Button icon={Stethoscope} onClick={() => goTo("doctor")}>
              Open the doctor panel
            </Button>
          }
        >
          Orders appear here as soon as the prescriber submits them.
        </EmptyState>
      ) : (
        <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,4fr)_minmax(0,8fr)]">
          <Card aria-labelledby="queue-h" className="overflow-hidden">
            <div className="px-5 pt-5">
              <h2 id="queue-h" className="text-xl font-bold text-navy-900">
                Submitted orders
              </h2>
              <dl className="mt-3 grid grid-cols-4 gap-2 text-center">
                {[
                  ["Pending", counts.pending, "text-navy-800 bg-navy-50"],
                  ["On hold", counts.onHold, "text-hold-800 bg-hold-50"],
                  ["To review", counts.requiresReview, "text-alert-800 bg-alert-50"],
                  ["Reviewed", counts.reviewed, "text-ok-800 bg-ok-50"],
                ].map(([label, n, cls]) => (
                  <div key={label} className={`rounded-lg px-1 py-2 ${cls}`}>
                    <dd className="text-2xl leading-none font-bold">{n}</dd>
                    <dt className="mt-1 text-xs font-semibold">{label}</dt>
                  </div>
                ))}
              </dl>
            </div>
            <ul className="mt-4 divide-y divide-line border-t border-line">
              {[...orders].reverse().map((o) => {
                const active = o.id === order.id;
                return (
                  <li key={o.id}>
                    <button
                      type="button"
                      onClick={() => setSelectedId(o.id)}
                      aria-current={active ? "true" : undefined}
                      className={`block w-full border-l-4 px-4 py-3 text-left transition-colors ${
                        active ? "border-navy-800 bg-navy-50" : "border-transparent hover:bg-navy-50/60"
                      }`}
                    >
                      <span className="flex flex-wrap items-center justify-between gap-2">
                        <OrderId>{o.id}</OrderId>
                        <StatusPill status={o.status} size="sm" />
                      </span>
                      <span
                        className={`mt-1 block font-semibold break-words ${
                          o.status === STATUS.DISCONTINUED ? "text-slate-500 line-through" : "text-navy-900"
                        }`}
                      >
                        {o.medication}
                      </span>
                      <span className="block text-sm text-muted">
                        {o.dose}, {o.route}, {o.frequency}
                      </span>
                      <span className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-sm font-semibold">
                        {o.alert ? (
                          <span className="flex items-center gap-1 text-alert-700">
                            <TriangleAlert className="h-4 w-4" aria-hidden="true" />
                            Allergy warning
                          </span>
                        ) : null}
                        {o.alert?.response?.type === "OVERRIDE" ? (
                          <span className="text-alert-700">Alert overridden</span>
                        ) : null}
                        {o.revisesId ? <span className="text-navy-700">Revised order</span> : null}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </Card>

          <OrderWorkspace key={order.id} order={order} onOpenOrder={setSelectedId} />
        </div>
      )}
    </div>
  );
}

function OrderWorkspace({ order, onOpenOrder }) {
  const { actions } = useStore();
  const { notify } = useUi();
  const open = isOpen(order);
  const flagged = Boolean(order.alert);

  return (
    <div className="space-y-5">
      <Card aria-labelledby="order-detail-h" className="p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-muted">
              Order <OrderId>{order.id}</OrderId>
              {order.revisesId ? (
                <>
                  , revised order replacing <OrderId>{order.revisesId}</OrderId>
                </>
              ) : null}
            </p>
            <h2 id="order-detail-h" className="text-[1.7rem] leading-tight font-bold break-words text-navy-900">
              {order.medication}
            </h2>
            <p className="text-lg text-ink">
              {order.dose}, {order.route}, {order.frequency}
            </p>
            <p className="mt-1 text-sm text-muted">
              Ordered by {order.prescriber} at {formatTime(order.submittedAt)} for {PATIENT.name} ({PATIENT.id})
            </p>
          </div>
          <StatusPill status={order.status} />
        </div>

        {flagged ? (
          <div className="mt-4 rounded-lg border-2 border-alert-600 bg-alert-50 px-4 py-3">
            <p className="flex items-center gap-2 text-lg font-bold text-alert-800">
              <TriangleAlert className="h-6 w-6 shrink-0 text-alert-600" aria-hidden="true" />
              Allergy warning attached to this order
            </p>
            <p className="mt-1 text-alert-800">
              Patient record documents a {order.alert.allergy} allergy and the order is for{" "}
              {order.medication}. Raised by rule <span className="font-mono font-semibold">{order.alert.ruleId}</span>{" "}
              at {formatTime(order.alert.raisedAt)}.
            </p>
            <div className="mt-3 border-t border-alert-200 pt-3">
              <p className="font-semibold text-alert-800">Prescriber response</p>
              {!order.alert.response ? (
                <p className="text-alert-800">No response yet. The alert is waiting for the prescriber.</p>
              ) : order.alert.response.type === "HOLD" ? (
                <p className="text-alert-800">
                  {order.alert.response.by} accepted the alert and held the order at{" "}
                  {formatTime(order.alert.response.at)}.
                </p>
              ) : (
                <>
                  <p className="text-alert-800">
                    {order.alert.response.by} overrode the alert at {formatTime(order.alert.response.at)}.
                    Override reason:
                  </p>
                  <p className="mt-1 border-l-4 border-alert-600 pl-3 text-lg font-semibold text-alert-800">
                    {order.alert.response.reason}
                  </p>
                </>
              )}
            </div>
          </div>
        ) : (
          <p className="mt-4 flex items-start gap-3 rounded-lg border border-line bg-navy-50 px-4 py-3 text-navy-900">
            <ScanSearch className="mt-0.5 h-5 w-5 shrink-0 text-navy-600" aria-hidden="true" />
            <span>
              No configured demo rule matched this order. That is not a statement of safety, so the
              order still needs a documented pharmacist review.
            </span>
          </p>
        )}

        {order.status === STATUS.DISCONTINUED ? (
          <div className="mt-4 flex flex-wrap items-center gap-3 rounded-lg border border-slate-300 bg-slate-100 px-4 py-3">
            <Ban className="h-6 w-6 shrink-0 text-slate-600" aria-hidden="true" />
            <p className="min-w-0 flex-1 text-slate-700">
              <span className="font-bold">Discontinued.</span> Replaced by revised order{" "}
              <OrderId>{order.revisedById}</OrderId>.
            </p>
            <Button variant="outline" size="sm" onClick={() => onOpenOrder(order.revisedById)}>
              Open revised order
            </Button>
          </div>
        ) : null}

        {order.status === STATUS.REVIEWED ? (
          <div className="mt-4 rounded-lg border border-ok-200 bg-ok-50 px-4 py-3">
            <p className="flex items-center gap-2 text-lg font-bold text-ok-800">
              <CircleCheck className="h-6 w-6" aria-hidden="true" />
              Reviewed by {order.review.by} at {formatTime(order.review.at)}
            </p>
            <p className="mt-1 text-ok-800">
              Reviewed means a pharmacist review was documented in this simulation. It is not a clinical
              safety claim.
            </p>
          </div>
        ) : null}
      </Card>

      {open && !flagged ? <ReviewCard order={order} /> : null}

      {open ? (
        <Card aria-labelledby="actions-h" className="p-5">
          <h2 id="actions-h" className="text-xl font-bold text-navy-900">
            {flagged ? "Resolve the allergy warning" : "Other pharmacist actions"}
          </h2>
          <ol className="mt-4 space-y-5">
            <Step n={1} done={order.status === STATUS.ON_HOLD} title="Place the order on hold">
              {order.status === STATUS.ON_HOLD ? (
                <p className="text-hold-800">
                  On hold, placed by the {order.heldBy === "physician" ? "prescriber" : "pharmacist"}. The
                  order cannot move to dispensing.
                </p>
              ) : (
                <Button
                  variant="outline"
                  icon={CirclePause}
                  disabled={!canHold(order)}
                  onClick={() => {
                    actions.holdOrder(order.id, "pharmacist");
                    notify("Order placed on hold by the pharmacist.", "hold");
                  }}
                >
                  Place on hold
                </Button>
              )}
            </Step>

            <Step n={2} done={order.interventions.length > 0} title="Record an intervention">
              <InterventionForm order={order} />
            </Step>

            <Step n={3} done={Boolean(order.prescriberContactedAt)} title="Contact the prescriber">
              {order.prescriberContactedAt ? (
                <p className="text-ink">
                  {STAFF.pharmacist.name} contacted {order.prescriber} at{" "}
                  {formatTime(order.prescriberContactedAt)} (simulated). The prescriber acknowledged and
                  will reassess the order.
                </p>
              ) : (
                <Button
                  variant="outline"
                  icon={PhoneCall}
                  onClick={() => {
                    actions.contactPrescriber(order.id);
                    notify("Prescriber contacted (simulated).");
                  }}
                >
                  Contact prescriber
                </Button>
              )}
            </Step>

            <Step n={4} done={false} title="Receive the prescriber's revised order">
              <RevisedOrderForm order={order} />
            </Step>
          </ol>
        </Card>
      ) : null}

      {open && flagged ? (
        <Card className="flex items-start gap-3 border-navy-200 bg-navy-50 p-5">
          <Lock className="mt-0.5 h-6 w-6 shrink-0 text-navy-700" aria-hidden="true" />
          <p className="text-navy-900">
            <span className="font-bold">This order cannot be marked as reviewed.</span> It carries an
            active allergy warning, and the simulation never clears a flagged order. It is resolved
            only when the prescriber sends a revised order, which is then checked and reviewed in its
            own right.
          </p>
        </Card>
      ) : null}

      {!open && order.interventions.length > 0 ? (
        <Card className="p-5">
          <h2 className="mb-2 text-xl font-bold text-navy-900">Interventions on this order</h2>
          <InterventionList items={order.interventions} />
        </Card>
      ) : null}
    </div>
  );
}

function Step({ n, done, title, children }) {
  return (
    <li className="grid grid-cols-[2.5rem_minmax(0,1fr)] gap-x-3">
      <span
        className={`flex h-10 w-10 items-center justify-center rounded-full text-lg font-bold ${
          done ? "bg-ok-700 text-white" : "border-2 border-navy-200 bg-white text-navy-800"
        }`}
        aria-hidden="true"
      >
        {done ? <Check className="h-5 w-5" /> : n}
      </span>
      <div className="min-w-0">
        <h3 className="flex min-h-10 items-center text-lg font-bold text-navy-900">
          {title}
          {done ? <span className="sr-only"> (done)</span> : null}
        </h3>
        <div className="mt-1">{children}</div>
      </div>
    </li>
  );
}

function InterventionList({ items }) {
  return (
    <ul className="space-y-2">
      {items.map((i) => (
        <li key={i.id} className="rounded-lg border border-line bg-navy-50 px-4 py-2.5">
          <p className="flex flex-wrap items-center gap-x-3 text-sm text-muted">
            <span className="font-mono font-semibold text-navy-800">{i.id}</span>
            <span>
              {i.kind}, {i.by}, {formatTime(i.at)}
            </span>
          </p>
          <p className="text-ink">{i.note}</p>
        </li>
      ))}
    </ul>
  );
}

function InterventionForm({ order }) {
  const { actions } = useStore();
  const { notify } = useUi();
  const [kind, setKind] = useState(order.alert ? INTERVENTION_TYPES[0] : INTERVENTION_TYPES[1]);
  const [note, setNote] = useState("");
  const ok = note.trim().length >= MIN_INTERVENTION_NOTE;

  return (
    <div className="space-y-3">
      {order.interventions.length > 0 ? <InterventionList items={order.interventions} /> : null}
      <form
        className="grid gap-3 sm:grid-cols-[minmax(0,17rem)_minmax(0,1fr)]"
        onSubmit={(e) => {
          e.preventDefault();
          if (!ok) return;
          actions.recordIntervention(order.id, kind, note);
          notify("Intervention recorded.");
          setNote("");
        }}
      >
        <SelectField
          id={`int-kind-${order.id}`}
          label="Type"
          options={INTERVENTION_TYPES}
          value={kind}
          onChange={(e) => setKind(e.target.value)}
        />
        <TextArea
          id={`int-note-${order.id}`}
          label="Intervention note"
          rows={2}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="What the pharmacist found and did"
        />
        <div className="sm:col-span-2">
          <Button type="submit" variant="outline" icon={MessageSquareText} disabled={!ok}>
            Record intervention
          </Button>
        </div>
      </form>
    </div>
  );
}

function RevisedOrderForm({ order }) {
  const { actions } = useStore();
  const { notify } = useUi();
  const [form, setForm] = useState(PLACEHOLDER_REVISED_ORDER);
  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));
  const contacted = Boolean(order.prescriberContactedAt);
  const ok = form.medication.trim() && form.dose.trim();

  if (!contacted) {
    return (
      <p className="flex items-center gap-2 text-muted">
        <Lock className="h-4 w-4 shrink-0" aria-hidden="true" />
        Contact the prescriber first. A revised order can only come from the prescriber.
      </p>
    );
  }

  return (
    <form
      className="rounded-lg border border-navy-200 bg-navy-50 p-4"
      onSubmit={(e) => {
        e.preventDefault();
        if (!ok) return;
        actions.submitRevised(order.id, form);
        notify("Revised order received. The original order was discontinued.");
      }}
    >
      <p className="mb-3 text-navy-900">
        Simulated prescriber response. RxGuard does not suggest a medication: the prescriber decides
        the revised therapy. A fictional placeholder is filled in for the demonstration.
      </p>
      <div className="grid gap-3 sm:grid-cols-2">
        <TextField
          id={`rev-med-${order.id}`}
          label="Medication as ordered by the prescriber"
          className="sm:col-span-2"
          value={form.medication}
          onChange={set("medication")}
          autoComplete="off"
        />
        <TextField
          id={`rev-dose-${order.id}`}
          label="Dose"
          className="sm:col-span-2"
          value={form.dose}
          onChange={set("dose")}
          autoComplete="off"
        />
        <SelectField id={`rev-route-${order.id}`} label="Route" options={ROUTES} value={form.route} onChange={set("route")} />
        <SelectField
          id={`rev-freq-${order.id}`}
          label="Frequency"
          options={FREQUENCIES}
          value={form.frequency}
          onChange={set("frequency")}
        />
      </div>
      <p className="mt-3 text-sm text-muted">
        The revised order goes through the same safety check and then needs its own pharmacist review.
      </p>
      <Button type="submit" className="mt-3" icon={FilePenLine} disabled={!ok}>
        Submit revised order
      </Button>
    </form>
  );
}

function ReviewCard({ order }) {
  const { actions } = useStore();
  const { notify } = useUi();
  const [ticks, setTicks] = useState(() => REVIEW_CHECKLIST.map(() => false));
  const all = ticks.every(Boolean);

  return (
    <Card aria-labelledby="review-h" className="border-2 border-navy-800 p-5">
      <h2 id="review-h" className="flex items-center gap-2 text-xl font-bold text-navy-900">
        <ClipboardCheck className="h-6 w-6 text-navy-600" aria-hidden="true" />
        {order.revisesId ? "Review the revised order" : "Pharmacist review"}
      </h2>
      <p className="mt-1 text-muted">
        Confirm each item before recording the review. Nothing is marked as reviewed automatically.
      </p>
      <ul className="mt-3 space-y-2">
        {REVIEW_CHECKLIST.map((item, i) => (
          <li key={item}>
            <label
              className={`flex min-h-12 cursor-pointer items-center gap-3 rounded-lg border px-4 py-2 text-lg transition-colors ${
                ticks[i] ? "border-ok-200 bg-ok-50 text-ok-800" : "border-navy-200 bg-white text-ink hover:bg-navy-50"
              }`}
            >
              <input
                type="checkbox"
                className="h-5 w-5 shrink-0 accent-ok-700"
                checked={ticks[i]}
                onChange={(e) => setTicks((t) => t.map((v, j) => (j === i ? e.target.checked : v)))}
              />
              {item}
            </label>
          </li>
        ))}
      </ul>
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <Button
          size="lg"
          icon={CircleCheck}
          disabled={!all}
          onClick={() => {
            actions.markReviewed(order.id);
            notify("Pharmacist review recorded.", "ok");
          }}
        >
          Mark as reviewed
        </Button>
        {!all ? (
          <p className="flex items-center gap-2 text-muted">
            <ShieldAlert className="h-4 w-4 shrink-0" aria-hidden="true" />
            Tick all {REVIEW_CHECKLIST.length} items to continue.
          </p>
        ) : null}
      </div>
    </Card>
  );
}
