/**
 * References between steps.
 *
 * A step property can read the output of another step with a template expression:
 *   "Hello {{ steps.6f1c...e2.output.fullName }}"
 *
 * Step ids are UUIDs. Output keys are plain identifiers.
 */

const REFERENCE_PATTERN = /\{\{\s*steps\.([0-9a-f-]{36})\.output\.(\w+)\s*\}\}/gi;

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
