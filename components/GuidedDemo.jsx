"use client";

import { useEffect, useRef } from "react";
import { ChevronRight, MessageCircleQuestion, Play, RotateCcw, X } from "lucide-react";
import { SCENARIOS } from "@/lib/guide";
import { Button } from "./ui";

export function ScenarioChooser({ onStart, onClose }) {
  const first = useRef(null);
  useEffect(() => {
    first.current?.focus();
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-navy-950/70 p-4"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="chooser-h"
        className="panel-in max-h-full w-full max-w-3xl overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 id="chooser-h" className="text-[1.7rem] leading-tight font-bold text-navy-900">
              Run a guided demonstration
            </h2>
            <p className="mt-1 text-lg text-muted">
              The demo resets, then walks through the workflow one step at a time with talking points.
              Use the Next button, the right arrow key or a presentation clicker.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-navy-800 hover:bg-navy-50"
          >
            <X className="h-6 w-6" aria-hidden="true" />
          </button>
        </div>

        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          {Object.values(SCENARIOS).map((sc, i) => (
            <div key={sc.id} className="flex flex-col rounded-xl border-2 border-navy-100 p-5">
              <p className="font-semibold text-navy-600">{sc.name}</p>
              <h3 className="text-2xl leading-tight font-bold text-navy-900">{sc.title}</h3>
              <p className="mt-2 flex-1 text-ink">{sc.summary}</p>
              <p className="mt-3 text-sm text-muted">{sc.steps.length} steps</p>
              <Button
                ref={i === 0 ? first : undefined}
                className="mt-3"
                variant={i === 0 ? "primary" : "outline"}
                icon={Play}
                onClick={() => onStart(sc.id)}
              >
                Start {sc.name}
              </Button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function GuideDock({ guide, onNext, onExit, onSwitch }) {
  const scenario = SCENARIOS[guide.id];
  const step = scenario.steps[guide.step];
  const next = scenario.steps[guide.step + 1];
  const other = Object.values(SCENARIOS).find((s) => s.id !== scenario.id);

  return (
    <aside
      aria-label="Guided demonstration"
      className="on-navy dock-in fixed inset-x-0 bottom-0 z-40 border-t-4 border-navy-600 bg-navy-950 text-white shadow-[0_-8px_30px_rgb(6_20_43/0.35)]"
    >
      <div className="mx-auto grid max-w-[1500px] gap-x-6 gap-y-3 px-4 py-3 sm:px-6 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <span className="font-semibold text-navy-200">
              {scenario.name}: {scenario.title}
            </span>
            <span className="flex items-center gap-1" aria-hidden="true">
              {scenario.steps.map((_, i) => (
                <span
                  key={i}
                  className={`h-1.5 w-5 rounded-full ${i <= guide.step ? "bg-white" : "bg-white/25"}`}
                />
              ))}
            </span>
            <span className="text-sm text-navy-200">
              Step {guide.step + 1} of {scenario.steps.length}
            </span>
          </div>
          <div aria-live="polite">
            <p className="mt-1 text-xl leading-tight font-bold sm:text-2xl">{step.title}</p>
            {step.ask ? (
              <p className="mt-1 flex items-start gap-2 text-lg leading-snug font-semibold text-white sm:text-xl">
                <MessageCircleQuestion className="mt-0.5 h-6 w-6 shrink-0 text-navy-300" aria-hidden="true" />
                <span>&ldquo;{step.ask}&rdquo;</span>
              </p>
            ) : null}
            <p className="mt-1 max-w-[95ch] text-sm leading-snug text-navy-100 sm:text-base">{step.say}</p>
          </div>
        </div>

        <div className="flex items-center gap-2 lg:justify-end">
          <Button variant="onNavyOutline" size="sm" icon={X} onClick={onExit}>
            <span className="max-sm:sr-only">End guide</span>
          </Button>
          {next ? (
            <Button variant="onNavy" size="lg" onClick={onNext} className="min-w-0 flex-1 justify-between lg:flex-none">
              <span className="text-left leading-tight">
                <span className="block text-sm font-semibold text-navy-700">Next step</span>
                <span className="block">{next.title}</span>
              </span>
              <ChevronRight className="h-6 w-6 shrink-0" aria-hidden="true" />
            </Button>
          ) : (
            <Button variant="onNavy" size="lg" icon={RotateCcw} className="min-w-0 flex-1 lg:flex-none" onClick={() => onSwitch(other.id)}>
              Run {other.name}
            </Button>
          )}
        </div>
      </div>
    </aside>
  );
}
