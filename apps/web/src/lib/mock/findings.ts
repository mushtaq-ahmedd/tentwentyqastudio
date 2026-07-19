import type { Evidence, Finding } from "@/lib/types";
import { AUDIT_COMPLETED, AUDIT_RUNNING } from "./audits";
import { PROJECT_ACME } from "./projects";

const CREATED_AT = "2026-07-16T09:44:32Z";
const RUNNING_CREATED_AT = "2026-07-17T11:59:00Z";

function evidenceFor(findingId: string, parts: Partial<Record<Evidence["type"], string>>): Evidence[] {
  return (Object.entries(parts) as [Evidence["type"], string][]).map(([type, content]) => ({
    id: `${findingId}-${type}`,
    findingId,
    type,
    content,
  }));
}

export let FINDINGS: Finding[] = [
  {
    id: "finding-1",
    auditId: AUDIT_COMPLETED,
    pageId: "page-homepage",
    pageName: "Homepage",
    projectId: PROJECT_ACME,
    engine: "UI Validation",
    severity: "critical",
    confidence: 0.99,
    title: "Missing CTA button",
    expectedResult: "Primary CTA button should be visible below the hero section.",
    actualResult: "Primary CTA button is missing from the homepage.",
    businessImpact:
      "Users may not be able to proceed to the primary conversion flow, reducing usability and conversion rate.",
    suggestedResolution:
      "Verify that the CTA component is rendered correctly and matches the approved design.",
    aiExplanation: null,
    status: "new",
    createdAt: CREATED_AT,
    evidence: evidenceFor("finding-1", {
      screenshot: "Screenshot preview",
      dom: '<section class="hero">\n  <h1>Build faster, ship safer</h1>\n  <!-- expected: <button class="cta"> -->\n</section>',
      html: '<div class="hero-content">\n  <h1>Build faster, ship safer</h1>\n  <p>Automated QA for modern teams</p>\n</div>',
      css: ".cta {\n  display: none; /* unexpected */\n  background: var(--color-accent-default);\n}",
      console: '[warn] Button component "cta-primary" not found in DOM\n[info] Hero section rendered in 812ms',
    }),
  },
  {
    id: "finding-2",
    auditId: AUDIT_COMPLETED,
    pageId: "page-pricing",
    pageName: "Pricing",
    projectId: PROJECT_ACME,
    engine: "Content",
    severity: "high",
    confidence: 0.94,
    title: "Pricing copy contradicts Terms page",
    expectedResult:
      "Pricing page copy should match the refund policy documented on the Terms page (30-day refund window).",
    actualResult: "Pricing page states refunds are available for 14 days, contradicting the Terms page.",
    businessImpact:
      "Conflicting policy language creates legal exposure and customer-support friction at checkout time.",
    suggestedResolution: "Align the Pricing page copy with the source-of-truth Terms page refund window.",
    aiExplanation: null,
    status: "new",
    createdAt: CREATED_AT,
    evidence: evidenceFor("finding-2", {
      screenshot: "Screenshot preview",
      html: '<p class="refund-note">Refunds available within 14 days of purchase.</p>',
      console: "[info] Content Validation compared 12 copy blocks against Requirements.pdf",
    }),
  },
  {
    id: "finding-3",
    auditId: AUDIT_COMPLETED,
    pageId: "page-checkout",
    pageName: "Checkout",
    projectId: PROJECT_ACME,
    engine: "Functional",
    severity: "critical",
    confidence: 0.97,
    title: "Checkout form fails validation",
    expectedResult: "Submitting the checkout form with valid data should proceed to confirmation.",
    actualResult: "Form submission throws a silent error and the page does not advance.",
    businessImpact: "Customers are fully blocked from completing purchases on this environment.",
    suggestedResolution: "Check the checkout API integration — likely a schema mismatch on the payment payload.",
    aiExplanation: null,
    status: "reviewed",
    createdAt: CREATED_AT,
    evidence: evidenceFor("finding-3", {
      screenshot: "Screenshot preview",
      console: "[error] POST /api/checkout 500 (Internal Server Error)\n[error] Uncaught TypeError: Cannot read properties of undefined",
    }),
  },
  {
    id: "finding-4",
    auditId: AUDIT_COMPLETED,
    pageId: "page-pricing",
    pageName: "Pricing",
    projectId: PROJECT_ACME,
    engine: "UI Validation",
    severity: "medium",
    confidence: 0.87,
    title: "Inconsistent button spacing",
    expectedResult: "Buttons should use the standard 16px horizontal padding token.",
    actualResult: "Plan comparison buttons use 12px padding, inconsistent with the design system.",
    businessImpact: "Minor visual inconsistency; unlikely to affect usability but breaks design system compliance.",
    suggestedResolution: "Update the button component instance to use the standard padding token.",
    aiExplanation: null,
    status: "new",
    createdAt: CREATED_AT,
    evidence: evidenceFor("finding-4", {
      screenshot: "Screenshot preview",
      css: ".plan-cta {\n  padding: 6px 12px; /* expected: 9px 16px */\n}",
    }),
  },
  {
    id: "finding-5",
    auditId: AUDIT_COMPLETED,
    pageId: "page-homepage",
    pageName: "Homepage",
    projectId: PROJECT_ACME,
    engine: "Content",
    severity: "low",
    confidence: 0.81,
    title: "Minor typo in footer copyright",
    expectedResult: 'Footer copyright line should read "© 2026 Acme Corp. All rights reserved."',
    actualResult: 'Footer reads "© 2026 Acme Corp. All rigths reserved."',
    businessImpact: "Cosmetic only; low visibility but reflects on brand polish.",
    suggestedResolution: "Fix the typo in the footer copy.",
    aiExplanation: null,
    status: "accepted",
    createdAt: CREATED_AT,
    evidence: evidenceFor("finding-5", {
      screenshot: "Screenshot preview",
      html: "<footer>© 2026 Acme Corp. All rigths reserved.</footer>",
    }),
  },
  {
    id: "finding-running-1",
    auditId: AUDIT_RUNNING,
    pageId: "page-running-homepage",
    pageName: "Homepage",
    projectId: PROJECT_ACME,
    engine: "UI Validation",
    severity: "critical",
    confidence: 0.99,
    title: "Missing CTA button",
    expectedResult: "Primary CTA button should be visible below the hero section.",
    actualResult: "Primary CTA button is missing from the homepage.",
    businessImpact: "Users may not be able to proceed to the primary conversion flow.",
    suggestedResolution: "Verify that the CTA component is rendered correctly and matches the approved design.",
    aiExplanation: null,
    status: "new",
    createdAt: RUNNING_CREATED_AT,
    evidence: evidenceFor("finding-running-1", { screenshot: "Screenshot preview" }),
  },
  {
    id: "finding-running-2",
    auditId: AUDIT_RUNNING,
    pageId: "page-running-pricing",
    pageName: "Pricing",
    projectId: PROJECT_ACME,
    engine: "UI Validation",
    severity: "medium",
    confidence: 0.87,
    title: "Inconsistent button spacing",
    expectedResult: "Buttons should use the standard 16px horizontal padding token.",
    actualResult: "Plan comparison buttons use 12px padding, inconsistent with the design system.",
    businessImpact: "Minor visual inconsistency; unlikely to affect usability but breaks design system compliance.",
    suggestedResolution: "Update the button component instance to use the standard padding token.",
    aiExplanation: null,
    status: "new",
    createdAt: RUNNING_CREATED_AT,
    evidence: evidenceFor("finding-running-2", { screenshot: "Screenshot preview" }),
  },
];

export function setFindingStatus(id: string, status: Finding["status"]) {
  FINDINGS = FINDINGS.map((f) => (f.id === id ? { ...f, status } : f));
}

export function bulkSetFindingStatus(ids: string[], status: Finding["status"]) {
  const idSet = new Set(ids);
  FINDINGS = FINDINGS.map((f) => (idSet.has(f.id) ? { ...f, status } : f));
}

export function deleteFindings(ids: string[]) {
  const idSet = new Set(ids);
  FINDINGS = FINDINGS.filter((f) => !idSet.has(f.id));
}
