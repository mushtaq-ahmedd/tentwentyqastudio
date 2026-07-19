/**
 * Importing an engine package runs its `registerEngine()` call as a side effect (see
 * packages/engines/discovery-engine/src/index.ts). Add future engines' imports here as they're
 * built — this file is the single place the Engine Registry (docs/03) gets populated from.
 */
import "@tentwenty/discovery-engine";
import "@tentwenty/browser-engine";
import "@tentwenty/content-engine";
import "@tentwenty/functional-engine";
import "@tentwenty/figma-engine";
import "@tentwenty/element-matching-engine";
import "@tentwenty/ui-validation-engine";
import "@tentwenty/confidence-engine";
import "@tentwenty/visual-engine";
import "@tentwenty/ai-engine";
