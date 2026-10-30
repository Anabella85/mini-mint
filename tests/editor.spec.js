import { beforeEach, describe, expect, it, vi } from "vitest";
import { createPinia, setActivePinia } from "pinia";

const pending = [];
const defer = (call, args) => {
  let resolve;
  let reject;
  const promise = new Promise((res, rej) => {
    resolve = res;
    reject = rej;
  });
  pending.push({ call, args, resolve, reject });
  return promise;
};

vi.mock("@/api", () => ({
  api: {
    getFlow: (...args) => defer("getFlow", args),
    saveFlow: (...args) => defer("saveFlow", args),
    listFlows: async () => [],
    subscribe: () => () => {}
  }
}));

const { useEditorStore } = await import("@/store/editor.js");

const makeFlow = (id, name) => ({
  id,
  name,
  version: 1,
  steps: [{ id: `${id}-step`, type: "SendEmail", displayName: "Email", properties: { to: "" } }],
  connections: []
});

const respond = (index, value) => pending[index].resolve(JSON.parse(JSON.stringify(value)));
const flush = () => new Promise((resolve) => setTimeout(resolve, 0));

beforeEach(() => {
  pending.length = 0;
  setActivePinia(createPinia());
});

describe("dirty state (#3)", () => {
  it("is clean after loading and dirty after an edit", async () => {
    const editor = useEditorStore();
    editor.openFlow("a");
    respond(0, makeFlow("a", "Flow A"));
    await flush();

    expect(editor.isDirty).toBe(false);
    editor.flow.steps[0].displayName = "Changed";
    expect(editor.isDirty).toBe(true);
  });

  it("discard restores the loaded flow", async () => {
    const editor = useEditorStore();
    editor.openFlow("a");
    respond(0, makeFlow("a", "Flow A"));
    await flush();

    editor.flow.steps[0].displayName = "Changed";
    editor.discard();
    expect(editor.flow.steps[0].displayName).toBe("Email");
    expect(editor.isDirty).toBe(false);
  });

  it("is clean after saving, and dirty again after the next edit", async () => {
    const editor = useEditorStore();
    editor.openFlow("a");
    respond(0, makeFlow("a", "Flow A"));
    await flush();

    editor.flow.steps[0].displayName = "Changed";
    editor.save();
    respond(1, { ...editor.flow, version: 2 });
    await flush();

    expect(editor.isDirty).toBe(false);
    editor.flow.steps[0].displayName = "Changed again";
    expect(editor.isDirty).toBe(true);
  });
});

describe("switching flows quickly (#2)", () => {
  it("ignores a response that arrives after a newer flow was opened", async () => {
    const editor = useEditorStore();
    editor.openFlow("kyc");
    editor.openFlow("contract");

    // The contract flow is smaller, so its response arrives first.
    respond(1, makeFlow("contract", "Contract signing"));
    await flush();
    respond(0, makeFlow("kyc", "KYC onboarding"));
    await flush();

    expect(editor.activeFlowId).toBe("contract");
    expect(editor.flow.name).toBe("Contract signing");
    expect(editor.loading).toBe(false);
  });

  it("keeps showing the loading state until the latest flow has arrived", async () => {
    const editor = useEditorStore();
    editor.openFlow("kyc");
    editor.openFlow("contract");

    respond(0, makeFlow("kyc", "KYC onboarding"));
    await flush();
    expect(editor.loading).toBe(true);
    expect(editor.flow).toBe(null);

    respond(1, makeFlow("contract", "Contract signing"));
    await flush();
    expect(editor.flow.name).toBe("Contract signing");
  });

  it("saves under the id of the flow shown in the editor", async () => {
    const editor = useEditorStore();
    editor.openFlow("kyc");
    respond(0, makeFlow("kyc", "KYC onboarding"));
    await flush();

    editor.save();
    expect(pending[1].call).toBe("saveFlow");
    expect(pending[1].args[0]).toBe("kyc");
  });

  it("does not show a saved flow if another flow was opened during the save", async () => {
    const editor = useEditorStore();
    editor.openFlow("kyc");
    respond(0, makeFlow("kyc", "KYC onboarding"));
    await flush();

    editor.save();
    editor.openFlow("contract");
    respond(2, makeFlow("contract", "Contract signing"));
    await flush();
    respond(1, { ...makeFlow("kyc", "KYC onboarding"), version: 2 });
    await flush();

    expect(editor.flow.name).toBe("Contract signing");
  });
});