/**
 * Demo data loaded into the fake backend on first start (and on "Reset demo data").
 */

const ref = (stepId, key) => `{{ steps.${stepId}.output.${key} }}`;

// --- KYC onboarding ---------------------------------------------------------
const K = {
  form: "1e7874a4-22fe-49a6-80aa-650983738958",
  idv: "2c37ea49-0d9e-42fe-ae2b-d1e05b9e7d94",
  ifNo: "bf715d1a-f56e-428b-b6ed-16db06985f96",
  crm: "a72a5a16-7088-4111-bd41-a030434540f0",
  welcome: "f2b6657f-e97f-4e83-a741-134db2904848",
  extra: "fdc7f3bc-f091-49d3-babb-d2c76705b20c",
  review: "d0c5fa7e-b377-44a4-afdc-7d54429fa007",
  sign: "f141a64f-aae1-4a16-b3c2-b7edd08518b1",
  confirm: "5c048769-3155-4832-8685-d63c7acf1fbc"
};

const kycOnboarding = {
  id: "flow-kyc",
  name: "KYC onboarding (Nordics)",
  version: 12,
  updatedAt: "2026-10-14T09:12:00.000Z",
  steps: [
    {
      id: K.form,
      type: "Form",
      displayName: "Contact details",
      properties: {
        title: "Start your onboarding",
        fields: [
          { key: "email", label: "Email" },
          { key: "phone", label: "Phone" },
          { key: "country", label: "Country of residence" }
        ]
      }
    },
    {
      id: K.idv,
      type: "IdVerification",
      displayName: "Verify identity",
      note: "<b>Heads up:</b> BankID only works for NO and SE residents.",
      properties: { provider: "BankID", country: ref(K.form, "country") }
    },
    {
      id: K.ifNo,
      type: "If",
      displayName: "Norwegian resident?",
      properties: { condition: `${ref(K.idv, "country")} == "NO"` }
    },
    {
      id: K.crm,
      type: "Webhook",
      displayName: "Create CRM customer",
      properties: {
        url: "https://crm.example.com/api/customers",
        body: {
          customer: { name: ref(K.idv, "fullName"), nationalId: ref(K.idv, "nationalId") },
          contact: { email: ref(K.form, "email"), phone: ref(K.form, "phone") }
        }
      }
    },
    {
      id: K.welcome,
      type: "SendEmail",
      displayName: "Welcome email",
      properties: { to: ref(K.form, "email"), subject: "Welcome!", body: `Hi ${ref(K.idv, "fullName")}, your account is ready.` }
    },
    {
      id: K.extra,
      type: "Form",
      displayName: "Extra due diligence",
      properties: {
        title: "A few more questions",
        fields: [
          { key: "sourceOfFunds", label: "Source of funds" },
          { key: "employer", label: "Employer" }
        ]
      }
    },
    {
      id: K.review,
      type: "SendEmail",
      displayName: "Notify compliance",
      properties: {
        to: "compliance@example.com",
        subject: "Manual review needed",
        body: `${ref(K.idv, "fullName")} declared source of funds: ${ref(K.extra, "sourceOfFunds")}`
      }
    },
    {
      id: K.sign,
      type: "Sign",
      displayName: "Sign customer agreement",
      properties: { documentName: "Customer agreement.pdf", signerName: ref(K.idv, "fullName") }
    },
    {
      id: K.confirm,
      type: "SendEmail",
      displayName: "Confirmation email",
      properties: {
        to: ref(K.form, "email"),
        subject: "Your agreement is signed",
        body: `Signed at ${ref(K.sign, "signedAt")}. CRM sync status: ${ref(K.crm, "status")}`
      }
    }
  ],
  // the backend does not guarantee any particular order
  connections: [
    { sourceStepId: K.ifNo, targetStepId: K.sign, outcome: "Done" },
    { sourceStepId: K.form, targetStepId: K.idv, outcome: "Done" },
    { sourceStepId: K.extra, targetStepId: K.review, outcome: "Done" },
    { sourceStepId: K.ifNo, targetStepId: K.crm, outcome: "True" },
    { sourceStepId: K.sign, targetStepId: K.confirm, outcome: "Done" },
    { sourceStepId: K.idv, targetStepId: K.ifNo, outcome: "Done" },
    { sourceStepId: K.crm, targetStepId: K.welcome, outcome: "Done" },
    { sourceStepId: K.ifNo, targetStepId: K.extra, outcome: "False" }
  ]
};

// --- Contract signing -------------------------------------------------------
const C = {
  form: "161ef269-75b5-443e-8b1a-ab6c5b1053c8",
  sign: "549bfe85-3eca-4749-9c2e-5571f85a2a2c",
  email: "36585c91-7e04-4818-80cb-998566032735"
};

const contractSigning = {
  id: "flow-contract",
  name: "Contract signing",
  version: 4,
  updatedAt: "2026-10-02T13:40:00.000Z",
  steps: [
    {
      id: C.form,
      type: "Form",
      displayName: "Signer details",
      properties: {
        title: "Who is signing?",
        fields: [
          { key: "fullName", label: "Full name" },
          { key: "email", label: "Email" }
        ]
      }
    },
    {
      id: C.sign,
      type: "Sign",
      displayName: "Sign contract",
      properties: { documentName: "Service contract.pdf", signerName: ref(C.form, "fullName") }
    },
    {
      id: C.email,
      type: "SendEmail",
      displayName: "Send signed copy",
      properties: {
        to: ref(C.form, "email"),
        subject: "Your signed contract",
        body: `Document id: ${ref(C.sign, "signedDocumentId")}`
      }
    }
  ],
  connections: [
    { sourceStepId: C.form, targetStepId: C.sign, outcome: "Done" },
    { sourceStepId: C.sign, targetStepId: C.email, outcome: "Done" }
  ]
};

// --- Age check (nested conditions) ------------------------------------------
const A = {
  idv: "e45ea37b-d657-4263-a9dd-8beea4ec3047",
  ifAdult: "dbe61b91-789d-47f0-af58-e55f7fd19f0e",
  ifNo: "12b7ace4-01d4-4819-9a03-109b7a59ac40",
  register: "abe2e081-5551-49bc-a501-b97fcaafa53c",
  reject: "3dc82e10-8a9b-4385-a328-fbfdcdefce5c",
  audit: "bacba7a1-3b32-4793-a5f6-c0ea221dcd47"
};

const ageCheck = {
  id: "flow-age",
  name: "Age check",
  version: 2,
  updatedAt: "2026-09-28T07:05:00.000Z",
  steps: [
    { id: A.idv, type: "IdVerification", displayName: "Verify identity", properties: { provider: "BankID", country: "NO" } },
    {
      id: A.ifAdult,
      type: "If",
      displayName: "18 or older?",
      properties: { condition: `${ref(A.idv, "dateOfBirth")} <= "2008-10-20"` }
    },
    {
      id: A.ifNo,
      type: "If",
      displayName: "Lives in Norway?",
      properties: { condition: `${ref(A.idv, "country")} == "NO"` }
    },
    {
      id: A.register,
      type: "Webhook",
      displayName: "Register adult customer",
      properties: { url: "https://registry.example.com/adults", body: { nin: ref(A.idv, "nationalId") } }
    },
    {
      id: A.reject,
      type: "SendEmail",
      displayName: "Rejection email",
      properties: { to: "support@example.com", subject: "Underage applicant", body: `Rejected: ${ref(A.idv, "fullName")}` }
    },
    {
      id: A.audit,
      type: "SendEmail",
      displayName: "Audit log",
      properties: { to: "audit@example.com", subject: "Age check finished", body: `Checked ${ref(A.idv, "fullName")}` }
    }
  ],
  connections: [
    { sourceStepId: A.idv, targetStepId: A.ifAdult, outcome: "Done" },
    { sourceStepId: A.ifAdult, targetStepId: A.ifNo, outcome: "True" },
    { sourceStepId: A.ifNo, targetStepId: A.register, outcome: "True" },
    { sourceStepId: A.ifAdult, targetStepId: A.reject, outcome: "False" },
    { sourceStepId: A.ifAdult, targetStepId: A.audit, outcome: "Done" }
  ]
};

// --- Stress test ------------------------------------------------------------
function buildStressFlow(blockCount = 50) {
  const id = (n) => `00000000-0000-4000-8000-${n.toString(16).padStart(12, "0")}`;
  const steps = [];
  const connections = [];
  let n = 1;
  let previousId = null;

  for (let b = 0; b < blockCount; b++) {
    const formId = id(n++);
    const idvId = id(n++);
    const ifId = id(n++);
    const yesId = id(n++);
    const noId = id(n++);
    const signId = id(n++);
    steps.push(
      { id: formId, type: "Form", displayName: `Form ${b + 1}`, properties: { title: `Page ${b + 1}`, fields: [{ key: "email", label: "Email" }] } },
      { id: idvId, type: "IdVerification", displayName: `Verify ${b + 1}`, properties: { provider: "BankID", country: "NO" } },
      { id: ifId, type: "If", displayName: `Check ${b + 1}`, properties: { condition: `${ref(idvId, "country")} == "NO"` } },
      { id: yesId, type: "SendEmail", displayName: `Email ${b + 1}`, properties: { to: ref(formId, "email"), subject: "Hi", body: ref(idvId, "fullName") } },
      { id: noId, type: "Webhook", displayName: `Webhook ${b + 1}`, properties: { url: "https://example.com", body: { name: ref(idvId, "fullName") } } },
      { id: signId, type: "Sign", displayName: `Sign ${b + 1}`, properties: { documentName: `Doc ${b + 1}.pdf`, signerName: ref(idvId, "fullName") } }
    );
    if (previousId) connections.push({ sourceStepId: previousId, targetStepId: formId, outcome: "Done" });
    connections.push(
      { sourceStepId: formId, targetStepId: idvId, outcome: "Done" },
      { sourceStepId: idvId, targetStepId: ifId, outcome: "Done" },
      { sourceStepId: ifId, targetStepId: yesId, outcome: "True" },
      { sourceStepId: ifId, targetStepId: noId, outcome: "False" },
      { sourceStepId: ifId, targetStepId: signId, outcome: "Done" }
    );
    previousId = signId;
  }

  return {
    id: "flow-stress",
    name: `Stress test (${steps.length} steps)`,
    version: 1,
    updatedAt: "2026-09-01T10:00:00.000Z",
    steps,
    connections
  };
}

export function createSeedFlows() {
  return [kycOnboarding, contractSigning, ageCheck, buildStressFlow()].map((flow) => structuredClone(flow));
}
