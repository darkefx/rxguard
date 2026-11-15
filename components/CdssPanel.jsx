"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Ban,
  Check,
  CircleDashed,
  CirclePause,
  Info,
  Link2,
  ListChecks,
  Minus,
  OctagonAlert,
  Pill,
  ScanSearch,
  ShieldAlert,
  Stethoscope,
  TriangleAlert,
} from "lucide-react";
import { MIN_OVERRIDE_REASON, PATIENT, STATUS, describeOrder, formatTime } from "@/lib/demoData";
import { DEMO_RULES } from "@/lib/rules";
import { useStore } from "@/lib/store";
import {
  Button,
  Card,
  EmptyState,
  OrderId,
  PanelHeading,
  PatientStrip,
  StatusPill,
  TextArea,
  useUi,
} from "./ui";

const CHECK_STYLE = {
  pass: { icon: Check, cls: "bg-ok-100 text-ok-800", word: "Passed" },
  match: { icon: TriangleAlert, cls: "bg-alert-600 text-white", word: "Match" },
  no_match: { icon: Minus, cls: "bg-navy-100 text-navy-800", word: "No match" },
  not_configured: { icon: CircleDashed, cls: "bg-slate-100 text-slate-500", word: "Not in demo" },
};

export default function CdssPanel() {
  const { state } = useStore();
  const { goTo } = useUi();
  const orders = state.orders;
  const [selectedId, setSelectedId] = useState(null);

  // When a new order arrives, show it.
  useEffect(() => setSelectedId(null), [orders.length]);

  const order = orders.find((o) => o.id === selectedId) ?? orders[orders.length - 1];

  // Play the check sequence only for an order that was submitted a moment ago.
  const orderId = order?.id;
  const fresh = useMemo(
    () => (order ? Date.now() - order.submittedAt < 2500 : false),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [orderId]
  );

  return (
    <div>
      <PanelHeading title="CPOE and clinical decision support">
        Each submitted order is checked against the patient&apos;s allergy record using the
        demonstration rule set. A flagged order is never marked safe automatically.
      </PanelHeading>
      <PatientStrip patient={PATIENT} />

      {!order ? (
        <EmptyState
          icon={ScanSearch}
          title="No orders have been checked yet"
          action={
            <Button icon={Stethoscope} onClick={() => goTo("doctor")}>
              Open the doctor panel
            </Button>
          }
        >
          Submit a medication order from the doctor panel. The safety check runs the moment the
          order is submitted.
        </EmptyState>
      ) : (
        <>
          {orders.length > 1 ? (
            <div className="mb-4 flex flex-wrap items-center gap-2" role="group" aria-label="Choose an order">
              <span className="mr-1 font-semibold text-navy-900">Order</span>
              {orders.map((o) => (
                <button
                  key={o.id}
                  type="button"
                  onClick={() => setSelectedId(o.id)}
                  aria-pressed={o.id === order.id}
                  className={`flex min-h-10 items-center gap-2 rounded-lg border px-3 font-semibold transition-colors ${
                    o.id === order.id
                      ? "border-navy-800 bg-navy-800 text-white"
                      : "border-navy-200 bg-white text-navy-900 hover:bg-navy-50"
                  }`}
                >
                  {o.alert ? <TriangleAlert className="h-4 w-4" aria-hidden="true" /> : null}
                  <OrderId>{o.id}</OrderId>
                </button>
              ))}
            </div>
          ) : null}

          <div key={order.id} className="grid items-start gap-5 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)]">
            {order.alert ? <AlertCard order={order} fresh={fresh} /> : <NoMatchCard order={order} fresh={fresh} />}

            <div className="space-y-5">
              <Card aria-labelledby="checks-h" className="overflow-hidden">
                <div className="px-5 pt-5">
                  <h2 id="checks-h" className="flex items-center gap-2 text-xl font-bold text-navy-900">
                    <ListChecks className="h-5 w-5 text-navy-600" aria-hidden="true" />
                    Checks run on <OrderId>{order.id}</OrderId>
                  </h2>
                  <p className="mt-0.5 text-muted">{describeOrder(order)}</p>
                </div>
                <div className="mt-3 h-1 bg-navy-50">
                  <div className={`h-full bg-navy-600 ${fresh ? "scan-bar" : ""}`} />
                </div>
                <ul className="divide-y divide-line px-5">
                  {order.checks.map((c, i) => {
                    const s = CHECK_STYLE[c.result];
                    const Icon = s.icon;
                    return (
                      <li
                        key={c.id}
                        className={`flex items-center gap-3 py-2.5 ${fresh ? "check-in" : ""}`}
                        style={{ "--i": i }}
                      >
                        <span
                          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${s.cls}`}
                          aria-hidden="true"
                        >
                          <Icon className="h-4.5 w-4.5" />
                        </span>
                        <div className="min-w-0 flex-1 leading-snug">
                          <p
                            className={`font-semibold ${
                              c.result === "not_configured" ? "text-slate-500" : "text-navy-900"
                            }`}
                          >
                            {c.label}
                          </p>
                          <p className="text-sm text-muted">{c.detail}</p>
                        </div>
                        <span
                          className={`shrink-0 text-sm font-bold ${
                            c.result === "match"
                              ? "text-alert-700"
                              : c.result === "not_configured"
                                ? "text-slate-500"
                                : "text-navy-800"
                          }`}
                        >
                          {s.word}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              </Card>

              <RuleSetCard />
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function AlertCard({ order, fresh }) {
  const { actions } = useStore();
  const { goTo, notify } = useUi();
  const [overriding, setOverriding] = useState(false);
  const [reason, setReason] = useState("");
  const alert = order.alert;
  const response = alert.response;
  const reasonOk = reason.trim().length >= MIN_OVERRIDE_REASON;
  const awaiting = !response && order.status === STATUS.PENDING;

  return (
    <Card
      aria-labelledby="alert-h"
      role={awaiting ? "alert" : undefined}
      className={`overflow-hidden border-2 border-alert-600 ${fresh ? "alert-in" : ""}`}
      style={{ "--delay": fresh ? "1150ms" : "0ms" }}
    >
      <div className="on-navy flex items-center gap-4 bg-alert-600 px-5 py-4 text-white">
        <span
          className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-white/15 ${
            awaiting ? "alert-ring" : ""
          }`}
          aria-hidden="true"
        >
          <OctagonAlert className="h-8 w-8" />
        </span>
        <div className="min-w-0 flex-1">
          <h2 id="alert-h" className="text-[1.7rem] leading-tight font-bold">
            High-priority safety alert
          </h2>
          <p className="text-lg text-white/90">A potential allergy match has been detected</p>
        </div>
        <span className="hidden rounded-md bg-white/15 px-2.5 py-1 font-mono text-sm font-semibold sm:block">
          {alert.id}
        </span>
      </div>

      <div className="space-y-5 p-5">
        <div className="grid items-stretch gap-2 sm:grid-cols-[1fr_auto_1fr]">
          <div className="rounded-lg border border-alert-200 bg-alert-50 px-4 py-3">
            <p className="text-sm font-semibold text-alert-800">Patient record</p>
            <p className="text-2xl leading-tight font-bold text-alert-800">{alert.allergy} allergy</p>
            <p className="text-sm text-alert-800">
              {PATIENT.name}, {PATIENT.id}
            </p>
          </div>
          <div className="flex items-center justify-center">
            <span className="flex items-center gap-1.5 rounded-full bg-alert-600 px-3 py-1.5 text-sm font-bold text-white">
              <Link2 className="h-4 w-4" aria-hidden="true" />
              Match
            </span>
          </div>
          <div className="rounded-lg border border-alert-200 bg-alert-50 px-4 py-3">
            <p className="text-sm font-semibold text-alert-800">Ordered medication</p>
            <p className="text-2xl leading-tight font-bold break-words text-alert-800">{order.medication}</p>
            <p className="text-sm text-alert-800">
              {order.dose}, {order.route}, {order.frequency}
            </p>
          </div>
        </div>

        <div>
          <h3 className="flex items-center gap-2 text-lg font-bold text-navy-900">
            <Info className="h-5 w-5 text-navy-600" aria-hidden="true" />
            Why this alert was generated
          </h3>
          <p className="mt-1 max-w-[68ch] text-lg leading-snug text-ink">{alert.explanation}</p>
        </div>

        <p className="rounded-lg bg-navy-900 px-4 py-3 text-lg font-semibold text-white">
          Do not dispense until the prescriber reviews and resolves this alert.
        </p>

        {order.status === STATUS.DISCONTINUED ? (
          <div className="flex items-start gap-3 rounded-lg border border-slate-300 bg-slate-100 px-4 py-3">
            <Ban className="mt-0.5 h-6 w-6 shrink-0 text-slate-600" aria-hidden="true" />
            <p className="text-slate-700">
              <span className="font-bold">This order was discontinued.</span> It was replaced by revised
              order <OrderId>{order.revisedById}</OrderId>. The alert stays on record.
            </p>
          </div>
        ) : null}

        {awaiting && !overriding ? (
          <div>
            <h3 className="mb-2 text-lg font-bold text-navy-900">Prescriber response required</h3>
            <div className="flex flex-wrap gap-3">
              <Button
                size="lg"
                icon={CirclePause}
                onClick={() => {
                  actions.holdOrder(order.id, "physician");
                  notify("Order placed on hold.", "hold");
                }}
              >
                Hold order
              </Button>
              <Button variant="dangerOutline" size="lg" icon={ShieldAlert} onClick={() => setOverriding(true)}>
                Override alert
              </Button>
            </div>
          </div>
        ) : null}

        {awaiting && overriding ? (
          <form
            className="rounded-lg border-2 border-alert-600 bg-alert-50 p-4"
            onSubmit={(e) => {
              e.preventDefault();
              if (!reasonOk) return;
              actions.overrideAlert(order.id, reason);
              notify("Alert overridden. Order sent to the pharmacist with the warning attached.", "alert");
              setOverriding(false);
            }}
          >
            <TextArea
              id="override-reason"
              label="Reason for overriding this alert (required)"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              autoFocus
              placeholder="Type the prescriber's reason"
              hint={
                reasonOk
                  ? "The reason is recorded in the audit trail and shown to the pharmacist."
                  : `Enter at least ${MIN_OVERRIDE_REASON} characters. ${reason.trim().length} so far.`
              }
            />
            <p className="mt-3 text-alert-800">
              Overriding does not clear the alert. The order goes to the pharmacist as Requires review
              with this warning attached.
            </p>
            <div className="mt-3 flex flex-wrap gap-3">
              <Button type="submit" variant="danger" icon={ShieldAlert} disabled={!reasonOk}>
                Confirm override
              </Button>
              <Button variant="outline" onClick={() => setOverriding(false)}>
                Cancel
              </Button>
            </div>
          </form>
        ) : null}

        {response?.type === "HOLD" ? (
          <div className="rounded-lg border border-hold-200 bg-hold-50 px-4 py-3">
            <p className="flex items-center gap-2 text-lg font-bold text-hold-800">
              <CirclePause className="h-5 w-5" aria-hidden="true" />
              Order held by the prescriber
            </p>
            <p className="mt-1 text-hold-800">
              {response.by} held the order at {formatTime(response.at)}. It cannot move to dispensing
              and is waiting for pharmacist follow-up.
            </p>
          </div>
        ) : null}

        {response?.type === "OVERRIDE" ? (
          <div className="rounded-lg border border-alert-200 bg-alert-50 px-4 py-3">
            <p className="flex items-center gap-2 text-lg font-bold text-alert-800">
              <ShieldAlert className="h-5 w-5" aria-hidden="true" />
              Alert overridden by the prescriber
            </p>
            <p className="mt-1 text-alert-800">
              {response.by} overrode the alert at {formatTime(response.at)}. Reason given:
            </p>
            <p className="mt-1 border-l-4 border-alert-600 pl-3 text-lg font-semibold text-alert-800">
              {response.reason}
            </p>
            <p className="mt-2 text-alert-800">
              The order has not been marked safe. It is in the pharmacist&apos;s review queue with this
              warning attached.
            </p>
          </div>
        ) : null}

        {!response && order.status === STATUS.ON_HOLD ? (
          <div className="rounded-lg border border-hold-200 bg-hold-50 px-4 py-3">
            <p className="flex items-center gap-2 text-lg font-bold text-hold-800">
              <CirclePause className="h-5 w-5" aria-hidden="true" />
              Order held by the pharmacist
            </p>
            <p className="mt-1 text-hold-800">
              The pharmacist placed the order on hold before the prescriber responded. It cannot move
              to dispensing.
            </p>
          </div>
        ) : null}

        {!awaiting ? (
          <div className="flex flex-wrap items-center gap-3">
            <StatusPill status={order.status} />
            <Button variant="outline" icon={Pill} onClick={() => goTo("pharmacist")}>
              Open the pharmacist panel
            </Button>
          </div>
        ) : null}
      </div>
    </Card>
  );
}

function NoMatchCard({ order, fresh }) {
  const { goTo } = useUi();
  return (
    <Card
      aria-labelledby="nomatch-h"
      className={`p-5 ${fresh ? "alert-in" : ""}`}
      style={{ "--delay": fresh ? "1150ms" : "0ms" }}
    >
      <div className="flex items-start gap-4">
        <span
          className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-navy-50 text-navy-700"
          aria-hidden="true"
        >
          <ScanSearch className="h-7 w-7" />
        </span>
        <div>
          <h2 id="nomatch-h" className="text-2xl leading-tight font-bold text-navy-900">
            No configured demo rule matched this order
          </h2>
          <p className="mt-1 text-lg text-muted">{describeOrder(order)}</p>
        </div>
      </div>
      <p className="mt-4 rounded-lg border border-hold-200 bg-hold-50 px-4 py-3 text-lg text-hold-800">
        <span className="font-bold">This does not mean the order is safe.</span> The simulation checks
        one hand-written allergy rule and nothing else. The order still needs a pharmacist&apos;s
        review before anything further happens.
      </p>
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <StatusPill status={order.status} />
        <Button variant="outline" icon={Pill} onClick={() => goTo("pharmacist")}>
          Open the pharmacist panel
        </Button>
      </div>
    </Card>
  );
}

function RuleSetCard() {
  return (
    <Card aria-labelledby="rules-h" className="p-5">
      <h2 id="rules-h" className="text-xl font-bold text-navy-900">
        Demonstration rule set
      </h2>
      {DEMO_RULES.map((r) => (
        <dl key={r.id} className="mt-3 space-y-2 rounded-lg bg-navy-50 px-4 py-3">
          <div className="flex gap-3">
            <dt className="w-14 shrink-0 font-semibold text-navy-800">Rule</dt>
            <dd className="font-mono font-semibold text-navy-900">{r.id}</dd>
          </div>
          <div className="flex gap-3">
            <dt className="w-14 shrink-0 font-semibold text-navy-800">If</dt>
            <dd className="text-ink">the patient record lists a {r.allergy} allergy</dd>
          </div>
          <div className="flex gap-3">
            <dt className="w-14 shrink-0 font-semibold text-navy-800">And</dt>
            <dd className="text-ink">
              the ordered medication name contains {r.triggerTerms.map((t) => `"${t}"`).join(", ")}
            </dd>
          </div>
          <div className="flex gap-3">
            <dt className="w-14 shrink-0 font-semibold text-navy-800">Then</dt>
            <dd className="text-ink">{r.action.toLowerCase()}</dd>
          </div>
        </dl>
      ))}
      <p className="mt-3 text-sm text-muted">
        This is the only rule in the simulation. It was written by hand for teaching and has not been
        clinically validated. A real CPOE draws on a maintained drug knowledge base.
      </p>
    </Card>
  );
}
