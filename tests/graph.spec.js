import { describe, expect, it } from "vitest";
import { buildTree, canRemoveStep, insertStep, removeStep } from "@/logic/graph.js";

const step = (id, type = "SendEmail") => ({ id, type, displayName: id, properties: {} });
const done = (sourceStepId, targetStepId) => ({ sourceStepId, targetStepId, outcome: "Done" });

/**
 *  a -> if --True--> t1 -> t2
 *          --False-> f1
 *       if --Done--> z
 */
function branchedFlow() {
  return {
    steps: [step("a"), step("if", "If"), step("t1"), step("t2"), step("f1"), step("z")],
    connections: [
      done("a", "if"),
      { sourceStepId: "if", targetStepId: "t1", outcome: "True" },
      done("t1", "t2"),
      { sourceStepId: "if", targetStepId: "f1", outcome: "False" },
      done("if", "z")
    ]
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
    insertStep(flow, step("new"), { branch: { ifStepId: "if", outcome: "False" } });
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

  it("reconnects the If to the next step after removing the first branch step", () => {
    const flow = branchedFlow();
    removeStep(flow, "t1");
    expect(flow.connections).toContainEqual({ sourceStepId: "if", targetStepId: "t2", outcome: "Done" });
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
