/**
 * Manual verification script for the matching algorithm — no automated test runner (vitest/jest)
 * is wired up anywhere in this repo yet (a known, tracked gap), so this is run directly:
 *   pnpm --filter @tentwenty/element-matching-engine exec tsx src/matching.verify.ts
 * Exercises the pure functions in matching.ts against synthetic Figma/DOM fixtures — this is
 * what stands in for live verification against a real Figma file, which needs a real personal
 * access token nobody has supplied yet (see the README's "Verification status").
 */
import { textSimilarity, bestMatchingFrame, matchElements, MATCH_THRESHOLD } from "./matching";

let failures = 0;
function check(label: string, condition: boolean, detail?: string) {
  if (condition) {
    console.log(`PASS  ${label}`);
  } else {
    failures++;
    console.log(`FAIL  ${label}${detail ? ` — ${detail}` : ""}`);
  }
}

check("exact text match scores 1.0", textSimilarity("Sign Up", "Sign Up") === 1);
check("exact match is case/whitespace-insensitive", textSimilarity("  Sign Up  ", "sign   up") === 1);

const near = textSimilarity("Sign up now!", "Sign up now");
check(
  `near-exact match clears MATCH_THRESHOLD (${near.toFixed(3)} >= ${MATCH_THRESHOLD})`,
  near >= MATCH_THRESHOLD && near < 1
);

const unrelated = textSimilarity("Submit", "Cancel");
check(
  `unrelated text stays below MATCH_THRESHOLD (${unrelated.toFixed(3)} < ${MATCH_THRESHOLD})`,
  unrelated < MATCH_THRESHOLD
);

const frames = [
  { id: "f1", name: "Homepage", type: "FRAME", absoluteBoundingBox: null, figmaPageId: "p1", figmaPageName: "Page 1" },
  { id: "f2", name: "Contact Us", type: "FRAME", absoluteBoundingBox: null, figmaPageId: "p1", figmaPageName: "Page 1" },
  { id: "f3", name: "About", type: "FRAME", absoluteBoundingBox: null, figmaPageId: "p1", figmaPageName: "Page 1" },
];
const matchedFrame = bestMatchingFrame("Homepage", frames);
check("bestMatchingFrame picks the correct frame", matchedFrame?.id === "f1", `got ${matchedFrame?.id}`);

const noFrame = bestMatchingFrame("Totally Unrelated Page Name Xyz", frames);
check("bestMatchingFrame returns null when nothing plausible matches", noFrame === null, `got ${noFrame?.id}`);

const figmaElements = [
  { id: "fe1", name: "Heading", type: "TEXT", text: "Welcome to Acme", figmaPageId: "p1", figmaPageName: "Page 1", parentFrameId: "f1", parentFrameName: "Homepage" },
  { id: "fe2", name: "CTA 1", type: "TEXT", text: "Learn More", figmaPageId: "p1", figmaPageName: "Page 1", parentFrameId: "f1", parentFrameName: "Homepage" },
  { id: "fe3", name: "CTA 2", type: "TEXT", text: "Learn More", figmaPageId: "p1", figmaPageName: "Page 1", parentFrameId: "f1", parentFrameName: "Homepage" },
  { id: "fe4", name: "Promo", type: "TEXT", text: "Exclusive Offer Ends Soon", figmaPageId: "p1", figmaPageName: "Page 1", parentFrameId: "f1", parentFrameName: "Homepage" },
];
const style = { color: "rgb(0, 0, 0)", backgroundColor: "rgba(0, 0, 0, 0)", fontFamily: "sans-serif", fontSize: "16px", fontWeight: "400", display: "block" };
const domElements = [
  { tag: "h1", text: "Welcome to Acme", x: 0, y: 0, width: 100, height: 20, style },
  { tag: "a", text: "Learn More", x: 0, y: 30, width: 80, height: 16, style },
  { tag: "a", text: "Learn More", x: 0, y: 60, width: 80, height: 16, style },
  { tag: "footer", text: "© 2026 Acme Inc.", x: 0, y: 90, width: 200, height: 16, style },
];

const results = matchElements("https://example.com/", figmaElements, domElements);
check("matchElements returns one result per figma element", results.length === 4, `got ${results.length}`);

const heading = results.find((r) => r.figmaElementId === "fe1");
check("heading matches exactly", heading?.matched === true && heading.confidence === 1);

const cta1 = results.find((r) => r.figmaElementId === "fe2");
const cta2 = results.find((r) => r.figmaElementId === "fe3");
check("both duplicate 'Learn More' elements matched (no double-claim collision)", cta1?.matched === true && cta2?.matched === true);

const promo = results.find((r) => r.figmaElementId === "fe4");
check("unrelated 'Exclusive Offer' element left unmatched (no false positive)", promo?.matched === false);

const matchedCount = results.filter((r) => r.matched).length;
check("exactly 3 of 4 figma elements matched (promo correctly excluded)", matchedCount === 3, `got ${matchedCount}`);

console.log(`\n${failures === 0 ? "ALL CHECKS PASSED" : `${failures} CHECK(S) FAILED`}`);
process.exit(failures === 0 ? 0 : 1);
