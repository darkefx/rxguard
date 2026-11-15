// All data in this file is fictional and exists only for the classroom demonstration.

export const PATIENT = {
  name: "Mr. Ahmed",
  initials: "MA",
  age: 58,
  id: "DEMO-001",
  location: "Demo Medical Ward (simulated)",
  allergies: ["Penicillin"],
};

export const STAFF = {
  physician: { name: "Dr. S. Malik", role: "Prescriber" },
  pharmacist: { name: "Pharm. A. Raza", role: "Hospital pharmacist" },
  system: { name: "RxGuard CPOE", role: "Automated check" },
};

export const ROUTES = ["Oral", "Intravenous", "Intramuscular", "Topical", "Inhaled"];

export const FREQUENCIES = [
  "Once daily",
  "Every 12 hours",
  "Every 8 hours",
  "Every 6 hours",
  "As a single dose",
];

// The preloaded example order used to trigger the demonstration alert.
export const EXAMPLE_ORDER = {
  medication: "Amoxicillin",
  dose: "500 mg",
  route: "Oral",
  frequency: "Every 8 hours",
};

export const EMPTY_ORDER = { medication: "", dose: "", route: "Oral", frequency: "Once daily" };

// The revised-order workflow never names a real alternative medicine.
// A fictional placeholder is pre-filled; the choice of therapy belongs to the prescriber.
export const PLACEHOLDER_REVISED_ORDER = {
  medication: "Medication X (fictional placeholder)",
  dose: "As ordered by prescriber",
  route: "Oral",
  frequency: "Once daily",
};

export const INTERVENTION_TYPES = [
  "Allergy alert follow-up",
  "Order clarification",
  "Prescriber query",
  "Other",
];

export const REVIEW_CHECKLIST = [
  "Order checked against the documented allergy record",
  "Order details confirmed with the prescriber",
  "Pharmacist review documented in the record",
];

export const STATUS = {
  PENDING: "PENDING",
  ON_HOLD: "ON_HOLD",
  REQUIRES_REVIEW: "REQUIRES_REVIEW",
  REVIEWED: "REVIEWED",
  DISCONTINUED: "DISCONTINUED",
};

export const STATUS_LABEL = {
  PENDING: "Pending",
  ON_HOLD: "On hold",
  REQUIRES_REVIEW: "Requires review",
  REVIEWED: "Reviewed",
  DISCONTINUED: "Discontinued",
};

export const MIN_OVERRIDE_REASON = 10;
export const MIN_INTERVENTION_NOTE = 5;

export function describeOrder(o) {
  return `${o.medication}, ${o.dose}, ${o.route}, ${o.frequency}`;
}

export function formatTime(ms) {
  return new Date(ms).toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}
