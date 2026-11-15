# RxGuard – Smart Medication Ordering System

An interactive classroom simulation of a hospital Computerized Physician Order Entry (CPOE) workflow, built for a Pharm-D presentation.

> **Educational simulation only.** The patient, staff and orders are fictional. The only safety logic is one hand-written demonstration rule. RxGuard is not a real prescribing system, is not clinically validated, and must not be used for patient care.

## What it shows

Four connected panels share one application state:

| Panel | What happens there |
| --- | --- |
| 1. Doctor panel | Fictional patient Mr. Ahmed (58, ID DEMO-001, documented Penicillin allergy). The prescriber enters a medication order. An Amoxicillin order is preloaded. |
| 2. CPOE decision support | The order is checked against the allergy record. The Amoxicillin/Penicillin match raises a high-priority alert, explains why, and requires the prescriber to **Hold order** or **Override alert** (a reason is mandatory). |
| 3. Pharmacist panel | Every submitted order with its status, allergy warning and override reason. The pharmacist can place an order on hold, record an intervention, contact the prescriber, receive a revised order and record a review. |
| 4. Audit trail | A timestamped timeline of order submissions, alerts, overrides and reasons, interventions and every status change. |

Safety behaviour built into the simulation:

- A flagged order is never marked safe or reviewed, by the system or by a user. It is resolved only through a revised order.
- "No rule matched" is always shown as "not a statement of safety", and the order still needs a pharmacist review.
- The revised-order step never suggests an alternative medicine. It pre-fills a fictional placeholder ("Medication X").
- A revised order must pass a three-item pharmacist checklist before it can be marked as reviewed.

## Presenting it

Click **Guided demo** (or press `G`) and pick a scenario. The demo resets and a presenter bar appears at the bottom with talking points and a **Next step** button.

- **Scenario A, the alert is heeded:** the physician holds the order, the pharmacist intervenes, a revised order is reviewed. Shows CPOE working as intended.
- **Scenario B, the alert is overridden:** the physician overrides with a reason and the pharmacist becomes the safety net. Shows alert fatigue and the limits of CPOE.

Both scenarios pause on an "Ask the class" step.

Keyboard shortcuts:

| Key | Action |
| --- | --- |
| `1` `2` `3` `4` | Switch panel |
| `G` | Open the guided demo chooser |
| `→` or `Page Down` | Next guided step (works with a presentation clicker) |

You can also ignore the guide and click through everything by hand. **Reset demo** clears all orders and audit events.

## Run it locally

Requires Node.js 20 or newer.

```bash
npm install
npm run dev
```

Open http://localhost:3000.

## Deploy to Vercel

1. Create a new repository on GitHub and push these files:
   ```bash
   git init
   git add .
   git commit -m "RxGuard CPOE simulation"
   git branch -M main
   git remote add origin https://github.com/YOUR-USERNAME/rxguard.git
   git push -u origin main
   ```
2. Go to https://vercel.com/new and import the repository.
3. Vercel detects Next.js automatically. Leave the defaults and click **Deploy**.

No environment variables, database or API keys are needed. Everything runs in the browser and nothing is saved between page loads.

## Project structure

```
app/
  layout.js          Fonts, metadata
  page.js            Renders the app
  globals.css        Tailwind theme (navy and white) and animations
components/
  RxGuardApp.jsx     Header, navigation, toasts, keyboard shortcuts, guided demo control
  DoctorPanel.jsx    Patient profile and order entry
  CdssPanel.jsx      Safety alert, hold and override, rule set
  PharmacistPanel.jsx  Order queue, interventions, revised order, review
  AuditTrail.jsx     Timeline
  GuidedDemo.jsx     Scenario chooser and presenter bar
  ui.jsx             Shared buttons, cards, form fields, status pills
lib/
  demoData.js        Fictional patient, staff, example order, labels
  rules.js           The demonstration rule set (one allergy rule)
  store.js           Shared state: reducer, actions, audit events
  guide.js           Guided demo scripts and talking points
```

## Changing the demo

- **Patient or staff names:** `lib/demoData.js`
- **The allergy rule:** `lib/rules.js` (`DEMO_RULES`)
- **Talking points and steps:** `lib/guide.js`

## Built with

Next.js (App Router), React, Tailwind CSS and Lucide icons. Typeface: Atkinson Hyperlegible, chosen for legibility on a classroom projector.
