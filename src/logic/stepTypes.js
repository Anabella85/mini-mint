/**
 * Catalog of the step types the editor knows about.
 *
 * `outputs(step)` describes what a step exposes to the steps that run after it.
 * Other steps read those values with a reference like `{{ steps.<stepId>.output.<key> }}`.
 */
export const STEP_TYPES = {
  Form: {
    label: "Form",
    icon: "form-step",
    defaults: () => ({
      title: "Tell us about yourself",
      fields: [
        { key: "email", label: "Email" },
        { key: "phone", label: "Phone" }
      ]
    }),
    outputs: (step) => (step.properties?.fields ?? []).map((f) => ({ key: f.key, label: f.label || f.key }))
  },
  IdVerification: {
    label: "ID verification",
    icon: "id-card",
    defaults: () => ({ provider: "BankID", country: "NO" }),
    outputs: () => [
      { key: "fullName", label: "Full name" },
      { key: "dateOfBirth", label: "Date of birth" },
      { key: "nationalId", label: "National ID" },
      { key: "country", label: "Country" }
    ]
  },
  Sign: {
    label: "Sign document",
    icon: "e-signing",
    defaults: () => ({ documentName: "Agreement.pdf", signerName: "" }),
    outputs: () => [
      { key: "signedDocumentId", label: "Signed document" },
      { key: "signedAt", label: "Signed at" }
    ]
  },
  SendEmail: {
    label: "Send email",
    icon: "email",
    defaults: () => ({ to: "", subject: "", body: "" }),
    outputs: () => []
  },
  Webhook: {
    label: "Webhook",
    icon: "api",
    defaults: () => ({ url: "https://", body: {} }),
    outputs: () => [
      { key: "status", label: "HTTP status" },
      { key: "response", label: "Response body" }
    ]
  },
  If: {
    label: "Condition",
    icon: "condition",
    defaults: () => ({ condition: "" }),
    outputs: () => []
  }
};

export const ADDABLE_STEP_TYPES = Object.keys(STEP_TYPES);

export function getStepOutputs(step) {
  return STEP_TYPES[step?.type]?.outputs(step) ?? [];
}

/** Catnip icon name for the step type (https://catnip.signicat.com/assets/icons/overview.html). */
export function getStepIcon(type) {
  return STEP_TYPES[type]?.icon ?? "flow";
}

export function getStepTypeLabel(type) {
  return STEP_TYPES[type]?.label ?? type;
}
