"use client";

import { useState } from "react";
import {
  ArrowDownUp,
  ArrowRight,
  CircleCheck,
  CirclePause,
  FilePenLine,
  History,
  MessageSquareText,
  OctagonAlert,
  PhoneCall,
  ScanSearch,
  Send,
  ShieldAlert,
  Activity,
  Stethoscope,
} from "lucide-react";
import { PATIENT, STAFF, formatTime } from "@/lib/demoData";
import { useStore } from "@/lib/store";
import { Button, Card, EmptyState, OrderId, PanelHeading, PatientStrip, StatusPill, useUi } from "./ui";

const TYPE_STYLE = {
  order_submitted: { icon: Send, node: "bg-navy-800 text-white" },
  revised: { icon: FilePenLine, node: "bg-navy-800 text-white" },
  alert: { icon: OctagonAlert, node: "bg-alert-600 text-white" },
  check_clear: { icon: ScanSearch, node: "bg-white text-navy-700 border-2 border-navy-200" },
  hold: { icon: CirclePause, node: "bg-hold-100 text-hold-800 border-2 border-hold-200" },
  override: { icon: ShieldAlert, node: "bg-alert-100 text-alert-800 border-2 border-alert-600" },
  intervention: { icon: MessageSquareText, node: "bg-navy-100 text-navy-800" },
  contact: { icon: PhoneCall, node: "bg-navy-100 text-navy-800" },
  review: { icon: CircleCheck, node: "bg-ok-700 text-white" },
  status: { icon: Activity, node: "bg-white text-slate-500 border-2 border-slate-300" },
};

const ACTORS = {
  physician: { label: "Physician", name: STAFF.physician.name, cls: "bg-navy-900 text-white" },
  system: { label: "CPOE system", name: STAFF.system.name, cls: "bg-white text-navy-900 border border-navy-300" },
  pharmacist: { label: "Pharmacist", name: STAFF.pharmacist.name, cls: "bg-navy-100 text-navy-900" },
};

const FILTERS = [
  { id: "all", label: "All events" },
  { id: "physician", label: "Physician" },
  { id: "system", label: "CPOE system" },
  { id: "pharmacist", label: "Pharmacist" },
];

export default function AuditTrail() {
  const { state } = useStore();
  const { goTo } = useUi();
  const [filter, setFilter] = useState("all");
  const [newestFirst, setNewestFirst] = useState(false);

  const events = state.audit.filter((e) => filter === "all" || e.actor === filter);
  const shown = newestFirst ? [...events].reverse() : events;
  const count = (type) => state.audit.filter((e) => e.type === type).length;

  return (
    <div>
      <PanelHeading title="Audit trail">
        A timestamped record of who did what, in the order it happened. Nothing in the trail can be
        edited from the other panels.
      </PanelHeading>
      <PatientStrip patient={PATIENT} />

      {state.audit.length === 0 ? (
        <EmptyState
          icon={History}
          title="Nothing has been recorded yet"
          action={
            <Button icon={Stethoscope} onClick={() => goTo("doctor")}>
              Open the doctor panel
            </Button>
          }
        >
          The trail starts when the prescriber submits the first order. Every alert, override,
          intervention and status change is added automatically.
        </EmptyState>
      ) : (
        <>
          <dl className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              ["Events recorded", state.audit.length],
              ["Safety alerts", count("alert")],
              ["Alert overrides", count("override")],
              ["Pharmacist interventions", count("intervention")],
            ].map(([label, n]) => (
              <Card as="div" key={label} className="px-4 py-3">
                <dd className="text-3xl leading-none font-bold text-navy-900">{n}</dd>
                <dt className="mt-1 text-muted">{label}</dt>
              </Card>
            ))}
          </dl>

          <Card className="p-5">
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap gap-2" role="group" aria-label="Filter events by who acted">
                {FILTERS.map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    aria-pressed={filter === f.id}
                    onClick={() => setFilter(f.id)}
                    className={`min-h-10 rounded-full border px-4 font-semibold transition-colors ${
                      filter === f.id
                        ? "border-navy-800 bg-navy-800 text-white"
                        : "border-navy-200 bg-white text-navy-900 hover:bg-navy-50"
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
              <Button variant="ghost" size="sm" icon={ArrowDownUp} onClick={() => setNewestFirst((v) => !v)}>
                {newestFirst ? "Showing newest first" : "Showing oldest first"}
              </Button>
            </div>

            {shown.length === 0 ? (
              <p className="py-6 text-center text-muted">No events from this role yet.</p>
            ) : (
              <ol className="relative">
                {shown.map((e, i) => {
                  const t = TYPE_STYLE[e.type] ?? TYPE_STYLE.status;
                  const Icon = t.icon;
                  const actor = ACTORS[e.actor];
                  const last = i === shown.length - 1;
                  const minor = e.type === "status";
                  return (
                    <li key={e.id} className="grid grid-cols-[2.75rem_minmax(0,1fr)] gap-x-3 sm:grid-cols-[5.5rem_2.75rem_minmax(0,1fr)]">
                      <time className="hidden pt-2 text-right font-mono text-sm font-semibold text-navy-800 sm:block">
                        {formatTime(e.at)}
                      </time>
                      <div className="relative flex justify-center">
                        {!last ? (
                          <span className="absolute top-10 bottom-0 w-0.5 bg-navy-100" aria-hidden="true" />
                        ) : null}
                        <span
                          className={`relative flex items-center justify-center rounded-full ${t.node} ${
                            minor ? "mt-1.5 h-8 w-8" : "h-10 w-10"
                          }`}
                          aria-hidden="true"
                        >
                          <Icon className={minor ? "h-4 w-4" : "h-5 w-5"} />
                        </span>
                      </div>
                      <div className={last ? "pb-1" : "pb-6"}>
                        <p className="flex flex-wrap items-center gap-x-2 gap-y-1 pt-1.5">
                          <span className={`rounded-md px-2 py-0.5 text-sm font-semibold ${actor.cls}`}>
                            {actor.label}
                          </span>
                          <span className="text-sm text-muted">{actor.name}</span>
                          <time className="font-mono text-sm font-semibold text-navy-800 sm:hidden">
                            {formatTime(e.at)}
                          </time>
                        </p>
                        {minor ? (
                          <p className="mt-1 flex flex-wrap items-center gap-2 font-semibold text-navy-900">
                            <OrderId>{e.orderId}</OrderId>
                            {e.from ? (
                              <>
                                <StatusPill status={e.from} size="sm" />
                                <ArrowRight className="h-4 w-4 text-muted" aria-label="changed to" />
                              </>
                            ) : (
                              <span className="text-muted">status set to</span>
                            )}
                            <StatusPill status={e.to} size="sm" />
                          </p>
                        ) : (
                          <p className="mt-1 text-xl leading-snug font-bold text-navy-900">
                            {e.title}
                            <span className="ml-2 text-base font-normal text-muted">
                              <OrderId>{e.orderId}</OrderId>
                            </span>
                          </p>
                        )}
                        {e.detail ? <p className="mt-0.5 max-w-[78ch] text-ink">{e.detail}</p> : null}
                      </div>
                    </li>
                  );
                })}
              </ol>
            )}
          </Card>
        </>
      )}
    </div>
  );
}
