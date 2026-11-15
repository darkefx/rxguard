"use client";

import { useState } from "react";
import { ClipboardList, FilePenLine, Send, ShieldAlert, TriangleAlert } from "lucide-react";
import {
  EMPTY_ORDER,
  EXAMPLE_ORDER,
  FREQUENCIES,
  PATIENT,
  ROUTES,
  STAFF,
  describeOrder,
  formatTime,
} from "@/lib/demoData";
import { useStore } from "@/lib/store";
import { Button, Card, OrderId, PanelHeading, SelectField, StatusPill, TextField, useUi } from "./ui";

export default function DoctorPanel() {
  const { state, actions } = useStore();
  const { goTo, notify } = useUi();
  const [form, setForm] = useState(() => (state.orders.length === 0 ? EXAMPLE_ORDER : EMPTY_ORDER));
  const [showErrors, setShowErrors] = useState(false);

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));
  const missingMed = !form.medication.trim();
  const missingDose = !form.dose.trim();

  function submit(e) {
    e.preventDefault();
    if (missingMed || missingDose) {
      setShowErrors(true);
      return;
    }
    actions.submitOrder(form);
    notify("Order submitted. Safety check running.");
    setForm(EMPTY_ORDER);
    setShowErrors(false);
    goTo("cdss");
  }

  return (
    <div>
      <PanelHeading title="Doctor panel">
        The prescriber enters a medication order for the patient. Submitting it sends the order
        through the CPOE safety check.
      </PanelHeading>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
        <Card aria-labelledby="patient-h" className="self-start overflow-hidden">
          <div className="on-navy flex items-center gap-4 bg-navy-900 px-5 py-5 text-white">
            <span
              className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-white text-2xl font-bold text-navy-900"
              aria-hidden="true"
            >
              {PATIENT.initials}
            </span>
            <div>
              <h2 id="patient-h" className="text-[1.7rem] leading-tight font-bold">
                {PATIENT.name}
              </h2>
              <p className="text-navy-200">Fictional patient for demonstration</p>
            </div>
          </div>

          <dl className="grid grid-cols-2 gap-x-4 gap-y-4 px-5 py-5">
            <div>
              <dt className="text-sm text-muted">Age</dt>
              <dd className="text-xl font-bold text-navy-900">{PATIENT.age} years</dd>
            </div>
            <div>
              <dt className="text-sm text-muted">Patient ID</dt>
              <dd className="font-mono text-xl font-bold text-navy-900">{PATIENT.id}</dd>
            </div>
            <div>
              <dt className="text-sm text-muted">Location</dt>
              <dd className="font-semibold text-navy-900">{PATIENT.location}</dd>
            </div>
            <div>
              <dt className="text-sm text-muted">Prescriber</dt>
              <dd className="font-semibold text-navy-900">{STAFF.physician.name}</dd>
            </div>
          </dl>

          <div className="mx-5 mb-5 flex items-start gap-3 rounded-lg border-2 border-alert-600 bg-alert-50 px-4 py-3.5">
            <TriangleAlert className="mt-1 h-7 w-7 shrink-0 text-alert-600" aria-hidden="true" />
            <div>
              <p className="font-semibold text-alert-800">Documented allergy</p>
              <p className="text-[1.6rem] leading-tight font-bold text-alert-800">
                {PATIENT.allergies.join(", ")}
              </p>
              <p className="mt-0.5 text-sm text-alert-800">Recorded in the simulated patient record</p>
            </div>
          </div>
        </Card>

        <div className="space-y-5">
          <Card aria-labelledby="order-h" className="p-5">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
              <h2 id="order-h" className="flex items-center gap-2 text-2xl font-bold text-navy-900">
                <FilePenLine className="h-6 w-6 text-navy-600" aria-hidden="true" />
                New medication order
              </h2>
              <span className="rounded-full bg-navy-50 px-3 py-1 text-sm font-semibold text-navy-800">
                Illustrative order, not a real prescription
              </span>
            </div>

            <form onSubmit={submit} noValidate>
              <div className="grid gap-4 sm:grid-cols-2">
                <TextField
                  id="med"
                  label="Medication name"
                  className="sm:col-span-2"
                  value={form.medication}
                  onChange={set("medication")}
                  placeholder="Type the medication name"
                  autoComplete="off"
                  error={showErrors && missingMed ? "Enter a medication name to submit the order." : null}
                />
                <TextField
                  id="dose"
                  label="Dose"
                  value={form.dose}
                  onChange={set("dose")}
                  placeholder="For example 500 mg"
                  autoComplete="off"
                  error={showErrors && missingDose ? "Enter a dose to submit the order." : null}
                />
                <SelectField id="route" label="Route" options={ROUTES} value={form.route} onChange={set("route")} />
                <SelectField
                  id="freq"
                  label="Frequency"
                  className="sm:col-span-2"
                  options={FREQUENCIES}
                  value={form.frequency}
                  onChange={set("frequency")}
                />
              </div>

              <div className="mt-5 flex flex-wrap items-center gap-3">
                <Button type="submit" size="lg" icon={Send}>
                  Submit order
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setForm(EXAMPLE_ORDER);
                    setShowErrors(false);
                  }}
                >
                  Load example order
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => {
                    setForm(EMPTY_ORDER);
                    setShowErrors(false);
                  }}
                >
                  Clear form
                </Button>
              </div>
            </form>
          </Card>

          <Card aria-labelledby="orders-h" className="p-5">
            <h2 id="orders-h" className="mb-3 flex items-center gap-2 text-xl font-bold text-navy-900">
              <ClipboardList className="h-5 w-5 text-navy-600" aria-hidden="true" />
              Orders for this patient
            </h2>
            {state.orders.length === 0 ? (
              <p className="text-muted">
                No orders yet. Submit the example order above to start the demonstration.
              </p>
            ) : (
              <ul className="divide-y divide-line">
                {[...state.orders].reverse().map((o) => {
                  const needsResponse = o.alert && !o.alert.response && o.status === "PENDING";
                  return (
                    <li key={o.id} className="flex flex-wrap items-center gap-x-4 gap-y-2 py-3">
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-navy-900">
                          <OrderId>{o.id}</OrderId>
                          <span className="ml-2">{describeOrder(o)}</span>
                        </p>
                        <p className="text-sm text-muted">
                          Submitted {formatTime(o.submittedAt)}
                          {o.revisesId ? `, replaces ${o.revisesId}` : ""}
                        </p>
                      </div>
                      <StatusPill status={o.status} size="sm" />
                      {needsResponse ? (
                        <Button variant="dangerOutline" size="sm" icon={ShieldAlert} onClick={() => goTo("cdss")}>
                          Respond to alert
                        </Button>
                      ) : null}
                    </li>
                  );
                })}
              </ul>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
