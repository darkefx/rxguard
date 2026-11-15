"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  CircleCheck,
  CirclePause,
  FlaskConical,
  History,
  Info,
  Pill,
  Presentation,
  RotateCcw,
  ShieldAlert,
  ShieldPlus,
  Stethoscope,
} from "lucide-react";
import { SCENARIOS } from "@/lib/guide";
import { StoreProvider, selectCounts, useStore } from "@/lib/store";
import AuditTrail from "./AuditTrail";
import CdssPanel from "./CdssPanel";
import DoctorPanel from "./DoctorPanel";
import { GuideDock, ScenarioChooser } from "./GuidedDemo";
import PharmacistPanel from "./PharmacistPanel";
import { Button, UiContext } from "./ui";

const PANELS = [
  { id: "doctor", label: "Doctor panel", short: "Doctor", icon: Stethoscope, component: DoctorPanel },
  { id: "cdss", label: "CPOE decision support", short: "CPOE check", icon: ShieldAlert, component: CdssPanel },
  { id: "pharmacist", label: "Pharmacist panel", short: "Pharmacist", icon: Pill, component: PharmacistPanel },
  { id: "audit", label: "Audit trail", short: "Audit", icon: History, component: AuditTrail },
];

const TOAST_STYLE = {
  info: { icon: Info, cls: "border-navy-200 bg-white text-navy-900" },
  hold: { icon: CirclePause, cls: "border-hold-200 bg-hold-50 text-hold-800" },
  alert: { icon: ShieldAlert, cls: "border-alert-200 bg-alert-50 text-alert-800" },
  ok: { icon: CircleCheck, cls: "border-ok-200 bg-ok-50 text-ok-800" },
};

export default function RxGuardApp() {
  return (
    <StoreProvider>
      <Shell />
    </StoreProvider>
  );
}

function Shell() {
  const { state, actions } = useStore();
  const [panel, setPanel] = useState("doctor");
  const [guide, setGuide] = useState(null); // { id, step }
  const [chooserOpen, setChooserOpen] = useState(false);
  const [toasts, setToasts] = useState([]);
  const toastSeq = useRef(0);
  const counts = selectCounts(state);

  const notify = useCallback((message, tone = "info") => {
    const id = ++toastSeq.current;
    setToasts((t) => [...t.slice(-2), { id, message, tone }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4000);
  }, []);

  const goTo = useCallback((id) => {
    setPanel(id);
    window.scrollTo({ top: 0 });
  }, []);

  const ui = useMemo(() => ({ panel, goTo, notify }), [panel, goTo, notify]);

  const resetDemo = useCallback(() => {
    actions.reset();
    setGuide(null);
    goTo("doctor");
    notify("Demo reset. All orders and audit events cleared.");
  }, [actions, goTo, notify]);

  const startScenario = useCallback(
    (id) => {
      actions.reset();
      setChooserOpen(false);
      setGuide({ id, step: 0 });
      goTo(SCENARIOS[id].steps[0].panel);
    },
    [actions, goTo]
  );

  const nextStep = useCallback(() => {
    if (!guide) return;
    const steps = SCENARIOS[guide.id].steps;
    const index = guide.step + 1;
    if (index >= steps.length) return;
    const step = steps[index];
    if (step.run.length) actions.runSequence(step.run);
    setGuide({ id: guide.id, step: index });
    goTo(step.panel);
  }, [guide, actions, goTo]);

  // Keyboard: 1 to 4 switch panels, G opens the guide, right arrow or Page Down
  // (what presentation clickers send) moves the guide forward.
  useEffect(() => {
    const onKey = (e) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const tag = e.target?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || e.target?.isContentEditable) return;
      if (chooserOpen) return;
      if (["1", "2", "3", "4"].includes(e.key)) {
        goTo(PANELS[Number(e.key) - 1].id);
      } else if (e.key.toLowerCase() === "g" && !guide) {
        setChooserOpen(true);
      } else if (guide && (e.key === "ArrowRight" || e.key === "PageDown")) {
        e.preventDefault();
        nextStep();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [chooserOpen, guide, goTo, nextStep]);

  const badges = {
    cdss: counts.unanswered ? { n: counts.unanswered, cls: "bg-alert-600 text-white", label: "alerts awaiting a response" } : null,
    pharmacist: counts.queue ? { n: counts.queue, cls: "bg-navy-800 text-white", label: "open orders" } : null,
    audit: counts.events ? { n: counts.events, cls: "bg-navy-100 text-navy-900", label: "events" } : null,
  };

  const Active = PANELS.find((p) => p.id === panel).component;

  return (
    <UiContext.Provider value={ui}>
      <div className={`flex min-h-screen flex-col ${guide ? "pb-60 sm:pb-52 lg:pb-44" : ""}`}>
        <header className="on-navy bg-navy-900 text-white">
          <div className="mx-auto flex max-w-[1500px] flex-wrap items-center gap-x-4 gap-y-3 px-4 py-3 sm:px-6">
            <div className="flex min-w-0 items-center gap-3">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white text-navy-900">
                <ShieldPlus className="h-7 w-7" aria-hidden="true" />
              </span>
              <div className="min-w-0 leading-tight">
                <p className="text-2xl font-bold tracking-tight">RxGuard</p>
                <p className="truncate text-navy-200">Smart Medication Ordering System</p>
              </div>
            </div>

            <p className="flex items-center gap-2 rounded-full border border-white/30 bg-white/10 px-3.5 py-1.5 font-semibold">
              <span className="demo-dot h-2.5 w-2.5 rounded-full bg-[#ffd166]" aria-hidden="true" />
              Demo mode
              <span className="hidden font-normal text-navy-200 md:inline">simulated data only</span>
            </p>

            <div className="flex w-full items-center gap-2 sm:ml-auto sm:w-auto">
              <Button
                variant="onNavy"
                className="flex-1 sm:flex-none"
                icon={Presentation}
                onClick={() => (guide ? setGuide(null) : setChooserOpen(true))}
                aria-pressed={Boolean(guide)}
              >
                {guide ? "End guide" : "Guided demo"}
              </Button>
              <Button variant="onNavyOutline" className="flex-1 sm:flex-none" icon={RotateCcw} onClick={resetDemo}>
                Reset demo
              </Button>
            </div>
          </div>
        </header>

        <p className="border-b border-hold-200 bg-hold-50 text-hold-800">
          <span className="mx-auto flex max-w-[1500px] items-center gap-2 px-4 py-1.5 text-sm font-semibold sm:px-6">
            <FlaskConical className="h-4 w-4 shrink-0" aria-hidden="true" />
            Educational simulation with a fictional patient. Not a real prescribing system and not a
            clinically validated decision-support tool.
          </span>
        </p>

        <nav aria-label="Workflow" className="sticky top-0 z-30 border-b border-line bg-white shadow-[0_2px_6px_rgb(10_33_71/0.06)]">
          <ol className="mx-auto grid max-w-[1500px] grid-cols-4 sm:px-6">
            {PANELS.map((p, i) => {
              const Icon = p.icon;
              const active = p.id === panel;
              const badge = badges[p.id];
              return (
                <li key={p.id}>
                  <button
                    type="button"
                    onClick={() => goTo(p.id)}
                    aria-current={active ? "page" : undefined}
                    className={`relative flex h-full w-full flex-col items-center gap-1 border-b-4 px-1 py-2.5 transition-colors sm:flex-row sm:gap-3 sm:px-3 sm:py-3.5 ${
                      active
                        ? "border-navy-800 bg-navy-50 text-navy-900"
                        : "border-transparent text-muted hover:bg-navy-50/60 hover:text-navy-900"
                    }`}
                  >
                    <span
                      className={`hidden h-8 w-8 shrink-0 items-center justify-center rounded-full text-base font-bold lg:flex ${
                        active ? "bg-navy-800 text-white" : "bg-navy-50 text-navy-800"
                      }`}
                      aria-hidden="true"
                    >
                      {i + 1}
                    </span>
                    <Icon className="h-6 w-6 shrink-0" aria-hidden="true" />
                    <span className="text-center text-sm leading-tight font-bold sm:text-left sm:text-lg">
                      <span className="xl:hidden">{p.short}</span>
                      <span className="hidden xl:inline">{p.label}</span>
                    </span>
                    {badge ? (
                      <span
                        className={`absolute top-1 right-1 flex h-6 min-w-6 items-center justify-center rounded-full px-1.5 text-sm font-bold sm:static sm:ml-auto ${badge.cls}`}
                      >
                        {badge.n}
                        <span className="sr-only"> {badge.label}</span>
                      </span>
                    ) : null}
                  </button>
                </li>
              );
            })}
          </ol>
        </nav>

        <main className="mx-auto w-full max-w-[1500px] flex-1 px-4 py-6 sm:px-6">
          <div key={`${panel}-${state.session}`} className="panel-in">
            <Active />
          </div>
        </main>

        <footer className="border-t border-line bg-white">
          <div className="mx-auto flex max-w-[1500px] flex-wrap items-center justify-between gap-x-6 gap-y-1 px-4 py-3 text-sm text-muted sm:px-6">
            <p>
              RxGuard is a classroom demonstration. Patient, staff and orders are fictional, and the only
              safety logic is one hand-written demo rule.
            </p>
            <p className="hidden md:block">
              Keys: 1 to 4 switch panels, G opens the guided demo, right arrow moves to the next step.
            </p>
          </div>
        </footer>

        <div
          className={`pointer-events-none fixed right-4 z-50 flex w-[min(26rem,calc(100vw-2rem))] flex-col gap-2 ${
            guide ? "bottom-60 sm:bottom-52 lg:bottom-44" : "bottom-4"
          }`}
          role="status"
          aria-live="polite"
        >
          {toasts.map((t) => {
            const s = TOAST_STYLE[t.tone] ?? TOAST_STYLE.info;
            const Icon = s.icon;
            return (
              <p
                key={t.id}
                className={`toast-in flex items-start gap-2.5 rounded-lg border px-4 py-3 font-semibold shadow-lg ${s.cls}`}
              >
                <Icon className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
                {t.message}
              </p>
            );
          })}
        </div>

        {chooserOpen ? <ScenarioChooser onStart={startScenario} onClose={() => setChooserOpen(false)} /> : null}
        {guide ? (
          <GuideDock guide={guide} onNext={nextStep} onExit={() => setGuide(null)} onSwitch={startScenario} />
        ) : null}
      </div>
    </UiContext.Provider>
  );
}
