import { describe, expect, it } from "vitest";
import {
  buildTree,
  canRemoveStep,
  insertStep,
  removeStep,
  getStepsGuaranteedBefore
} from "@/logic/graph.js";
import { createSeedFlows } from "@/api/seed.js";

const step = (id, type = "SendEmail") => ({
  id,
  type,
  displayName: id,
  properties: {},
});
const done = (sourceStepId, targetStepId) => ({
  sourceStepId,
  targetStepId,
  outcome: "Done",
});

/**
 *  a -> if --True--> t1 -> t2
 *          --False-> f1
 *       if --Done--> z
 */
function branchedFlow() {
  return {
    steps: [
      step("a"),
      step("if", "If"),
      step("t1"),
      step("t2"),
      step("f1"),
      step("z"),
    ],
    connections: [
      done("a", "if"),
      { sourceStepId: "if", targetStepId: "t1", outcome: "True" },
      done("t1", "t2"),
      { sourceStepId: "if", targetStepId: "f1", outcome: "False" },
      done("if", "z"),
    ],
  };
}

const ids = (nodes) => nodes.map((n) => n.step.id);

describe("buildTree", () => {
  it("builds the main sequence and the branches", () => {
    const tree = buildTree(branchedFlow());
    expect(ids(tree)).toEqual(["a", "if", "z"]);
    expect(ids(tree[1].branches.True)).toEqual(["t1", "t2"]);
    expect(ids(tree[1].branches.False)).toEqual(["f1"]);
  });

  it("does not depend on the order of connections", () => {
    const flow = branchedFlow();
    flow.connections.reverse();
    expect(ids(buildTree(flow))).toEqual(["a", "if", "z"]);
  });
});

describe("insertStep", () => {
  it("inserts after a step", () => {
    const flow = branchedFlow();
    insertStep(flow, step("new"), { afterStepId: "a" });
    expect(ids(buildTree(flow))).toEqual(["a", "new", "if", "z"]);
  });

  it("inserts at the start of a branch", () => {
    const flow = branchedFlow();
    insertStep(flow, step("new"), {
      branch: { ifStepId: "if", outcome: "False" },
    });
    expect(ids(buildTree(flow)[1].branches.False)).toEqual(["new", "f1"]);
  });

  it("inserts at the beginning of the flow", () => {
    const flow = branchedFlow();
    insertStep(flow, step("new"));
    expect(ids(buildTree(flow))).toEqual(["new", "a", "if", "z"]);
  });
});

describe("removeStep", () => {
  it("removes a step from the main sequence and reconnects its neighbours", () => {
    const flow = branchedFlow();
    removeStep(flow, "a");
    expect(ids(buildTree(flow))).toEqual(["if", "z"]);
  });

  it("removes the last step of a branch", () => {
    const flow = branchedFlow();
    removeStep(flow, "t2");
    expect(ids(buildTree(flow)[1].branches.True)).toEqual(["t1"]);
  });

  // The original version of this test expected outcome "Done", which is the bug from report #1.
  it("reconnects the If to the next step after removing the first branch step", () => {
    const flow = branchedFlow();
    removeStep(flow, "t1");
    expect(flow.connections).toContainEqual({
      sourceStepId: "if",
      targetStepId: "t2",
      outcome: "True",
    });
    const tree = buildTree(flow);
    expect(ids(tree)).toEqual(["a", "if", "z"]);
    expect(ids(tree[1].branches.True)).toEqual(["t2"]);
  });

  it("removes the only step of a branch, leaving the branch empty", () => {
    const flow = branchedFlow();
    removeStep(flow, "f1");
    expect(buildTree(flow)[1].branches.False).toEqual([]);
    expect(
      flow.connections.some(
        (c) => c.sourceStepId === "if" && c.outcome === "False",
      ),
    ).toBe(false);
  });

  it("removes a step in the middle of a branch", () => {
    const flow = branchedFlow();
    insertStep(flow, step("t3"), { afterStepId: "t2" });
    removeStep(flow, "t2");
    expect(ids(buildTree(flow)[1].branches.True)).toEqual(["t1", "t3"]);
  });

  it("removes the merge step of an If and keeps the Done connection", () => {
    const flow = branchedFlow();
    insertStep(flow, step("end"), { afterStepId: "z" });
    removeStep(flow, "z");
    expect(ids(buildTree(flow))).toEqual(["a", "if", "end"]);
  });

  it("keeps the incoming connection's other fields when removing a step", () => {
    const flow = branchedFlow();
    flow.connections.find((c) => c.targetStepId === "t1").label = "Norwegian";
    removeStep(flow, "t1");
    expect(flow.connections).toContainEqual({
      sourceStepId: "if",
      targetStepId: "t2",
      outcome: "True",
      label: "Norwegian",
    });
  });

  it("only allows removing an If when its branches are empty", () => {
    const flow = branchedFlow();
    expect(canRemoveStep(flow, "if")).toBe(false);
    removeStep(flow, "f1");
    removeStep(flow, "t2");
    removeStep(flow, "t1");
    expect(canRemoveStep(flow, "if")).toBe(true);
  });
});

describe("getStepsGuaranteedBefore", () => {
  const before = (flow, id) => getStepsGuaranteedBefore(flow, id).map((s) => s.id);

  it("returns nothing for the first step", () => {
    expect(before(branchedFlow(), "a")).toEqual([]);
  });

  it("includes the If and everything before it for a step inside a branch", () => {
    expect(before(branchedFlow(), "t1")).toEqual(["a", "if"]);
  });

  it("includes earlier steps of the same branch", () => {
    expect(before(branchedFlow(), "t2")).toEqual(["a", "if", "t1"]);
  });

  it("never includes the other branch", () => {
    expect(before(branchedFlow(), "f1")).toEqual(["a", "if"]);
  });

  it("does not include branch steps after the merge, because only one branch ran", () => {
    expect(before(branchedFlow(), "z")).toEqual(["a", "if"]);
  });

  it("returns nothing for an unknown step", () => {
    expect(before(branchedFlow(), "missing")).toEqual([]);
  });

    // demo flows: find a step by its name and return the names of the steps before it
  const namesBefore = (flowId, stepName) => {
    const flow = createSeedFlows().find((f) => f.id === flowId);
    const step = flow.steps.find((s) => s.displayName === stepName);
    return getStepsGuaranteedBefore(flow, step.id).map((s) => s.displayName);
  };

  it("handles nested conditions (Age check demo flow)", () => {
    expect(namesBefore("flow-age", "Register adult customer")).toEqual([
      "Verify identity",
      "18 or older?",
      "Lives in Norway?"
    ]);
    expect(namesBefore("flow-age", "Audit log")).toEqual(["Verify identity", "18 or older?"]);
  });

  it("does not offer the CRM webhook to the confirmation email (KYC demo flow)", () => {
    expect(namesBefore("flow-kyc", "Welcome email")).toEqual([
      "Contact details",
      "Verify identity",
      "Norwegian resident?",
      "Create CRM customer"
    ]);
    expect(namesBefore("flow-kyc", "Confirmation email")).toEqual([
      "Contact details",
      "Verify identity",
      "Norwegian resident?",
      "Sign customer agreement"
    ]);
  });
});
