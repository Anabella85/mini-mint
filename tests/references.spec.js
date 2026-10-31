import { describe, expect, it } from "vitest";
import { findStepsUsingOutputsOf, getAvailableOutputs, makeReference } from "@/logic/references.js";
import { createSeedFlows } from "@/api/seed.js";
import { describe, expect, it } from "vitest";
import { mount } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import { getAvailableOutputs, makeReference } from "@/logic/references.js";
import { createSeedFlows } from "@/api/seed.js";
import { useEditorStore } from "@/store/editor.js";
import ReferencePicker from "@/components/ReferencePicker.vue";

// fresh copy of the KYC demo flow for each test, so a test can change it safely
const kycFlow = () => createSeedFlows().find((f) => f.id === "flow-kyc");
const stepId = (flow, name) => flow.steps.find((s) => s.displayName === name).id;

describe("getAvailableOutputs", () => {
  it("groups outputs by step, skips steps without outputs and builds the reference", () => {
    const flow = kycFlow();
    const groups = getAvailableOutputs(flow, stepId(flow, "Welcome email"));

    // "Norwegian resident?" is an If and has no outputs, so it is not listed.
    expect(groups.map((g) => g.step.displayName)).toEqual(["Contact details", "Verify identity", "Create CRM customer"]);
    expect(groups[1].outputs[0]).toEqual({
      key: "fullName",
      label: "Full name",
      reference: makeReference(stepId(flow, "Verify identity"), "fullName")
    });
  });

  it("leaves out Form fields whose key can't be used in a reference", () => {
    const flow = kycFlow();
    const form = flow.steps.find((s) => s.displayName === "Contact details");
    form.properties.fields.push({ key: "", label: "Not filled in yet" }, { key: "first name", label: "Has a space" });

    const [contact] = getAvailableOutputs(flow, stepId(flow, "Verify identity"));
    expect(contact.outputs.map((o) => o.key)).toEqual(["email", "phone", "country"]);
  });
});

describe("ReferencePicker", () => {
  it("emits the reference of the clicked output", async () => {
    setActivePinia(createPinia());
    const editor = useEditorStore();
    editor.flow = kycFlow();

    const wrapper = mount(ReferencePicker, { props: { stepId: stepId(editor.flow, "Sign customer agreement") } });
    const items = wrapper.findAll("catnip-list-item");
    expect(items.map((i) => i.text())).toEqual([
      "Email", "Phone", "Country of residence",
      "Full name", "Date of birth", "National ID", "Country"
    ]);

    await items[3].trigger("click");
    expect(wrapper.emitted("select")).toEqual([[makeReference(stepId(editor.flow, "Verify identity"), "fullName")]]);
  });
});

describe("findStepsUsingOutputsOf", () => {
  // returns [step name, output keys] pairs, so results are easy to read
  const usages = (flow, name) =>
    findStepsUsingOutputsOf(flow, stepId(flow, name)).map((u) => [u.step.displayName, u.outputKeys]);

  it("finds references in plain strings, in nested objects and in conditions", () => {
    const flow = kycFlow();
    expect(usages(flow, "Verify identity")).toEqual([
      ["Norwegian resident?", ["country"]],
      ["Create CRM customer", ["fullName", "nationalId"]],
      ["Welcome email", ["fullName"]],
      ["Notify compliance", ["fullName"]],
      ["Sign customer agreement", ["fullName"]]
    ]);
  });

  it("finds references inside arrays, also written without spaces", () => {
    const flow = kycFlow();
    const extra = flow.steps.find((s) => s.displayName === "Extra due diligence");
    extra.properties.fields.push({ key: "name", label: `Name: {{steps.${stepId(flow, "Contact details")}.output.email}}` });
    expect(usages(flow, "Contact details")).toContainEqual(["Extra due diligence", ["email"]]);
  });

  it("returns nothing when no step uses the outputs", () => {
    const flow = kycFlow();
    expect(usages(flow, "Welcome email")).toEqual([]);
  });

  it("does not match a reference to a different step", () => {
    const flow = kycFlow();
    expect(usages(flow, "Notify compliance")).toEqual([]);
  });
});