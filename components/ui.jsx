"use client";

import { createContext, useContext } from "react";
import { Ban, CircleCheck, CirclePause, Eye, Hourglass } from "lucide-react";
import { STATUS_LABEL } from "@/lib/demoData";

// Navigation and toast helpers shared by every panel.
export const UiContext = createContext(null);
export const useUi = () => useContext(UiContext);

const BUTTON_VARIANTS = {
  primary: "bg-navy-800 text-white hover:bg-navy-700 disabled:bg-navy-200 disabled:text-white",
  danger: "bg-alert-600 text-white hover:bg-alert-700 disabled:bg-alert-200 disabled:text-white",
  dangerOutline:
    "border-2 border-alert-600 bg-white text-alert-700 hover:bg-alert-50 disabled:border-alert-200 disabled:text-alert-200",
  outline:
    "border border-navy-200 bg-white text-navy-900 hover:bg-navy-50 disabled:text-navy-300 disabled:hover:bg-white",
  ghost: "text-navy-700 hover:bg-navy-50 disabled:text-navy-300",
  onNavy: "bg-white text-navy-900 hover:bg-navy-100",
  onNavyOutline: "border border-white/40 text-white hover:bg-white/10",
};

const BUTTON_SIZES = {
  sm: "min-h-10 px-3 text-sm gap-1.5",
  md: "min-h-12 px-4 text-base gap-2",
  lg: "min-h-14 px-6 text-lg gap-2.5",
};

export function Button({
  variant = "primary",
  size = "md",
  icon: Icon,
  children,
  className = "",
  type = "button",
  ...props
}) {
  return (
    <button
      type={type}
      className={`inline-flex items-center justify-center rounded-lg font-semibold transition-colors ${BUTTON_VARIANTS[variant]} ${BUTTON_SIZES[size]} ${className}`}
      {...props}
    >
      {Icon ? <Icon className="h-[1.15em] w-[1.15em] shrink-0" aria-hidden="true" /> : null}
      {children}
    </button>
  );
}

export function Card({ as: Tag = "section", className = "", children, ...props }) {
  return (
    <Tag
      className={`rounded-xl border border-line bg-white shadow-[0_1px_2px_rgb(10_33_71/0.06)] ${className}`}
      {...props}
    >
      {children}
    </Tag>
  );
}

export function PanelHeading({ title, children }) {
  return (
    <header className="mb-5">
      <h1 className="text-[1.75rem] leading-tight font-bold text-navy-900">{title}</h1>
      {children ? <p className="mt-1 max-w-[70ch] text-lg text-muted">{children}</p> : null}
    </header>
  );
}

const STATUS_STYLE = {
  PENDING: { icon: Hourglass, cls: "border-navy-200 bg-navy-50 text-navy-800" },
  ON_HOLD: { icon: CirclePause, cls: "border-hold-200 bg-hold-50 text-hold-800" },
  REQUIRES_REVIEW: { icon: Eye, cls: "border-alert-200 bg-alert-50 text-alert-800" },
  REVIEWED: { icon: CircleCheck, cls: "border-ok-200 bg-ok-50 text-ok-800" },
  DISCONTINUED: { icon: Ban, cls: "border-slate-300 bg-slate-100 text-slate-600" },
};

export function StatusPill({ status, size = "md" }) {
  const s = STATUS_STYLE[status];
  if (!s) return null;
  const Icon = s.icon;
  return (
    <span
      className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border font-semibold whitespace-nowrap ${s.cls} ${
        size === "sm" ? "px-2.5 py-0.5 text-sm" : "px-3 py-1 text-base"
      }`}
    >
      <Icon className="h-[1em] w-[1em]" aria-hidden="true" />
      {STATUS_LABEL[status]}
    </span>
  );
}

export function OrderId({ children }) {
  return <span className="font-mono text-[0.92em] font-semibold tracking-tight">{children}</span>;
}

const inputBase =
  "h-12 w-full rounded-lg border border-navy-200 bg-white px-3.5 text-lg text-ink placeholder:text-slate-400 hover:border-navy-300 focus:border-navy-600 focus:outline-none focus:ring-3 focus:ring-navy-100";

export function TextField({ label, hint, error, id, className = "", ...props }) {
  return (
    <div className={className}>
      <label htmlFor={id} className="mb-1.5 block font-semibold text-navy-900">
        {label}
      </label>
      <input
        id={id}
        className={`${inputBase} ${error ? "border-alert-600" : ""}`}
        aria-invalid={error ? "true" : undefined}
        aria-describedby={error ? `${id}-err` : hint ? `${id}-hint` : undefined}
        {...props}
      />
      {error ? (
        <p id={`${id}-err`} className="mt-1 text-sm font-medium text-alert-700">
          {error}
        </p>
      ) : hint ? (
        <p id={`${id}-hint`} className="mt-1 text-sm text-muted">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

export function SelectField({ label, id, options, className = "", ...props }) {
  return (
    <div className={className}>
      <label htmlFor={id} className="mb-1.5 block font-semibold text-navy-900">
        {label}
      </label>
      <select id={id} className={`${inputBase} pr-8`} {...props}>
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    </div>
  );
}

export function TextArea({ label, id, hint, className = "", ...props }) {
  return (
    <div className={className}>
      <label htmlFor={id} className="mb-1.5 block font-semibold text-navy-900">
        {label}
      </label>
      <textarea
        id={id}
        rows={3}
        className={`${inputBase} h-auto py-2.5 leading-snug`}
        aria-describedby={hint ? `${id}-hint` : undefined}
        {...props}
      />
      {hint ? (
        <p id={`${id}-hint`} className="mt-1 text-sm text-muted">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

export function EmptyState({ icon: Icon, title, children, action }) {
  return (
    <Card className="flex flex-col items-center px-6 py-14 text-center">
      <span className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-navy-50 text-navy-700">
        <Icon className="h-8 w-8" aria-hidden="true" />
      </span>
      <h2 className="text-2xl font-bold text-navy-900">{title}</h2>
      <p className="mt-2 max-w-[52ch] text-lg text-muted">{children}</p>
      {action ? <div className="mt-6">{action}</div> : null}
    </Card>
  );
}

// Compact patient strip shown above the CPOE, pharmacist and audit panels.
export function PatientStrip({ patient }) {
  return (
    <div className="mb-5 flex flex-wrap items-center gap-x-6 gap-y-2 rounded-xl border border-line bg-white px-4 py-3">
      <div className="flex items-center gap-3">
        <span
          className="flex h-10 w-10 items-center justify-center rounded-full bg-navy-900 font-bold text-white"
          aria-hidden="true"
        >
          {patient.initials}
        </span>
        <div className="leading-tight">
          <p className="text-lg font-bold text-navy-900">{patient.name}</p>
          <p className="text-sm text-muted">
            Age {patient.age}, ID <span className="font-mono">{patient.id}</span>, fictional patient
          </p>
        </div>
      </div>
      <p className="flex items-center gap-2 rounded-lg border border-alert-200 bg-alert-50 px-3 py-1.5 font-semibold text-alert-800">
        <span className="h-2.5 w-2.5 rounded-full bg-alert-600" aria-hidden="true" />
        Documented allergy: {patient.allergies.join(", ")}
      </p>
    </div>
  );
}
