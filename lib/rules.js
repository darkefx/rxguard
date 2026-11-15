// Demonstration rule set.
//
// These rules are written by hand for teaching. They are the ONLY logic the
// simulation uses. They are not a drug database, they are not clinically
// validated, and "no rule matched" never means an order is safe.

export const DEMO_RULES = [
  {
    id: "DEMO-ALG-001",
    name: "Penicillin allergy and penicillin-class order",
    type: "Allergy",
    severity: "High",
    allergy: "Penicillin",
    // An order matches when its medication name contains one of these terms.
    triggerTerms: ["amoxicillin", "ampicillin", "penicillin"],
    action: "Raise a high-priority alert and require a prescriber response",
  },
];

// Checks a real CPOE would usually also run. They are listed so the class can
// see what is missing, and are deliberately not implemented here.
const NOT_CONFIGURED = [
  { id: "interaction", label: "Drug interaction check" },
  { id: "dose", label: "Dose range check" },
  { id: "duplicate", label: "Duplicate therapy check" },
];

function normalise(text) {
  return String(text || "").trim().toLowerCase();
}

export function evaluateOrder(fields, patient) {
  const medication = normalise(fields.medication);
  const checks = [
    {
      id: "complete",
      label: "Order fields complete",
      result: "pass",
      detail: "Medication, dose, route and frequency entered",
    },
    {
      id: "record",
      label: "Patient record loaded",
      result: "pass",
      detail: `${patient.id}, documented allergy: ${patient.allergies.join(", ")}`,
    },
  ];

  let match = null;
  for (const rule of DEMO_RULES) {
    const hasAllergy = patient.allergies.some((a) => normalise(a) === normalise(rule.allergy));
    const term = rule.triggerTerms.find((t) => medication.includes(t));
    if (hasAllergy && term) {
      match = {
        ruleId: rule.id,
        severity: rule.severity,
        allergy: rule.allergy,
        matchedTerm: term,
        explanation:
          `Demo rule ${rule.id} fires when the patient record lists a ${rule.allergy} allergy ` +
          `and the ordered medication name contains "${term}". ` +
          `${fields.medication.trim()} is listed in this rule as a penicillin-class medication, ` +
          `and ${patient.name}'s record documents a ${rule.allergy} allergy.`,
      };
    }
    checks.push({
      id: rule.id,
      label: `Allergy rule ${rule.id}`,
      result: hasAllergy && term ? "match" : "no_match",
      detail:
        hasAllergy && term
          ? `Match: ${rule.allergy} allergy on record, "${term}" in order`
          : "No match for this order",
    });
  }

  for (const c of NOT_CONFIGURED) {
    checks.push({ ...c, result: "not_configured", detail: "Not configured in this simulation" });
  }

  return { checks, match };
}
