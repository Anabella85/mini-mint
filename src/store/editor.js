import { defineStore } from "pinia";
import { api } from "@/api";
import {
  buildTree,
  canRemoveStep,
  getStep,
  insertStep,
  removeStep,
} from "@/logic/graph.js";
import { useFlowsStore } from "./flows.js";
import { useUiStore } from "./ui.js";
import { getStepOutputs, STEP_TYPES } from "@/logic/stepTypes.js";
import { findStepsUsingOutputsOf } from "@/logic/references.js";

let latestLoadId = 0;
/** Deep copy, so the editable flow and the saved snapshot never share objects. */
const clone = (value) => JSON.parse(JSON.stringify(value));

/** The readable label of one of the step's outputs, e.g. "status" → "HTTP status". */
function outputLabel(step, key) {
  const output = getStepOutputs(step).find((o) => o.key === key);
  return output ? output.label : key;
}

let unsubscribe = null;

export const useEditorStore = defineStore("editor", {
  state: () => ({
    activeFlowId: null,
    flow: null,
    original: null,
    loading: false,
    saving: false,
    selectedStepId: null,
    pendingDelete: null,
  }),

  getters: {
    tree: (state) => (state.flow ? buildTree(state.flow) : []),
    selectedStep: (state) =>
      state.flow && state.selectedStepId
        ? getStep(state.flow, state.selectedStepId)
        : null,
    isDirty: (state) =>
      !!state.flow &&
      JSON.stringify(state.flow) !== JSON.stringify(state.original),
  },

  actions: {
    async openFlow(flowId) {
      if (flowId === this.activeFlowId) return;
      if (
        this.isDirty &&
        !window.confirm("You have unsaved changes. Discard them?")
      )
        return;

      const requestId = ++latestLoadId;

      unsubscribe?.();
      unsubscribe = null;

      this.activeFlowId = flowId;
      this.selectedStepId = null;
      this.pendingDelete = null;
      this.flow = null;
      this.loading = true;
      this.original = null;

      try {
        const flow = await api.getFlow(flowId);
        if (requestId !== latestLoadId) return; // ignore if a newer request has been made
        this.flow = flow;
        this.original = clone(flow);
        unsubscribe = api.subscribe(flowId, (event) =>
          this.handleRealtimeEvent(event),
        );
      } catch (error) {
        if (requestId !== latestLoadId) return; // ignore if a newer request has been made
        useUiStore().notify({
          intent: "danger",
          text: `Could not load flow: ${error.message}`,
        });
      } finally {
        if (requestId === latestLoadId) this.loading = false;
      }
    },

    async save() {
      if (!this.flow) return;

      const flowId = this.flow.id;
      this.saving = true;

      try {
        const saved = await api.saveFlow(this.activeFlowId, this.flow);
        useUiStore().notify({ intent: "success", text: "Flow saved" });
        useFlowsStore().fetchFlows();
        if (this.flow?.id !== flowId) return;
        this.flow = saved;
        this.original = clone(saved);
      } catch (error) {
        useUiStore().notify({
          intent: "danger",
          text: `Save failed: ${error.message}`,
        });
      } finally {
        this.saving = false;
      }
    },

    discard() {
      this.flow = clone(this.original);
      this.selectedStepId = null;
      this.pendingDelete = null;
    },

    handleRealtimeEvent(event) {
      // TODO: nothing reacts to server events yet
      console.info("[realtime]", event);
    },

    selectStep(stepId) {
      this.selectedStepId = stepId;
    },

    addStep(type, position) {
      const definition = STEP_TYPES[type];
      const step = {
        id: crypto.randomUUID(),
        type,
        displayName: definition.label,
        properties: definition.defaults(),
      };
      insertStep(this.flow, step, position);
      this.selectedStepId = step.id;
    },

    /** Deletes a step, or asks for confirmation first when other steps use its outputs. */
    deleteStep(stepId) {
      if (!canRemoveStep(this.flow, stepId)) {
        useUiStore().notify({
          intent: "warning",
          text: "Remove the steps inside this condition first.",
        });
        return;
      }

      const usages = findStepsUsingOutputsOf(this.flow, stepId);

      // nobody depends on this step: delete it right away
      if (usages.length === 0) {
        this.removeStepNow(stepId);
        return;
      }

      // other steps use its outputs: remember the delete, the dialog asks first
      const step = getStep(this.flow, stepId);
      this.pendingDelete = {
        stepId,
        displayName: step.displayName,
        usages: usages.map((usage) => ({
          stepId: usage.step.id,
          displayName: usage.step.displayName,
          outputs: usage.outputKeys.map((key) => outputLabel(step, key)),
        })),
      };
    },

    removeStepNow(stepId) {
      removeStep(this.flow, stepId);
      if (this.selectedStepId === stepId) this.selectedStepId = null;
    },

    confirmDelete() {
      if (!this.pendingDelete) return;
      this.removeStepNow(this.pendingDelete.stepId);
      this.pendingDelete = null;
    },

    cancelDelete() {
      this.pendingDelete = null;
    },
  },
});
