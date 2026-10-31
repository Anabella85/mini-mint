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