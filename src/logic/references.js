/**
 * References between steps.
 *
 * A step property can read the output of another step with a template expression:
 *   "Hello {{ steps.6f1c...e2.output.fullName }}"
 *
 * Step ids are UUIDs. Output keys are plain identifiers.
 */

import { getStepsGuaranteedBefore } from "./graph.js";
import { getStepOutputs } from "./stepTypes.js";

const REFERENCE_PATTERN = /\{\{\s*steps\.([0-9a-f-]{36})\.output\.(\w+)\s*\}\}/gi;
const OUTPUT_KEY_PATTERN = /^\w+$/;

export function makeReference(stepId, outputKey) {
  return `{{ steps.${stepId}.output.${outputKey} }}`;
}

/**
 * Lists the references found in a single string.
 * @param {string} text
 * @returns {{ stepId: string, outputKey: string, raw: string }[]}
 */
export function parseReferences(text) {
  if (typeof text !== "string") return [];
  return [...text.matchAll(REFERENCE_PATTERN)].map((m) => ({ raw: m[0], stepId: m[1], outputKey: m[2] }));
}

/**
 * The outputs `stepId` can reference, grouped by the step that produces them.
 * Only steps that are guaranteed to have run before it are included (see getStepsGuaranteedBefore).
 * Steps without outputs are left out, and so are output keys that a reference can't express
 * (e.g. a Form field whose key is still empty).
 * @returns {{ step: object, outputs: { key: string, label: string, reference: string }[] }[]}
 */
export function getAvailableOutputs(flow, stepId) {
  return getStepsGuaranteedBefore(flow, stepId)
    .map((step) => ({
      step,
      outputs: getStepOutputs(step)
       .filter((output) => OUTPUT_KEY_PATTERN.test(output.key))
      .map((output) => ({
        ...output,
        reference: makeReference(step.id, output.key)
      }))
    }))
    .filter((group) => group.outputs.length);
}

/** Every string inside a value, however deeply it is nested in objects and arrays. */
function collectStrings(value, into = []) {
  if (typeof value === "string") into.push(value);
  else if (Array.isArray(value)) value.forEach((item) => collectStrings(item, into));
  else if (value && typeof value === "object") Object.values(value).forEach((item) => collectStrings(item, into));
  return into;
}

/**
 * The other steps whose properties reference an output of `stepId`.
 * Looks at every property, including nested objects (webhook body) and arrays (form fields).
 * @returns {{ step: object, outputKeys: string[] }[]}
 */
export function findStepsUsingOutputsOf(flow, stepId) {
  const usages = [];

  for (const step of flow.steps) {
    if (step.id === stepId) continue;

    const references = collectStrings(step.properties).flatMap(parseReferences);
    const outputKeys = references
      .filter((ref) => ref.stepId.toLowerCase() === stepId.toLowerCase())
      .map((ref) => ref.outputKey);

    if (outputKeys.length) {
      usages.push({ step, outputKeys: [...new Set(outputKeys)] });
    }
  }

  return usages;
}

/**
 * The text with every reference replaced by "Step name › Output label", for display only.
 * References to a step that no longer exists are shown as "⚠ missing step".
 */
export function toReadableText(flow, text) {
  if (typeof text !== "string") return "";

  return text.replace(REFERENCE_PATTERN, (raw, refStepId, outputKey) => {
    const step = flow.steps.find((s) => s.id.toLowerCase() === refStepId.toLowerCase());
    if (!step) return "⚠ missing step";

    const output = getStepOutputs(step).find((o) => o.key === outputKey);
    return `${step.displayName} › ${output ? output.label : outputKey}`;
  });
}