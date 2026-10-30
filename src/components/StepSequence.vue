<template>
  <div class="sequence">
    <AddStepButton :position="startPosition" />
    <template v-for="node in nodes" :key="node.step.id">
      <StepCard :step="node.step" />
      <div v-if="node.branches" class="branches">
        <div v-for="(branchNodes, outcome) in node.branches" :key="outcome" class="branch">
          <catnip-badge size="s" .intent="outcome === 'True' ? 'success' : 'danger'">{{ outcome }}</catnip-badge>
          <StepSequence :nodes="branchNodes" :context="{ kind: 'branch', ifStepId: node.step.id, outcome }" />
        </div>
      </div>
      <AddStepButton :position="{ afterStepId: node.step.id }" />
    </template>
  </div>
</template>

<script setup>
import { computed } from "vue";
import StepCard from "./StepCard.vue";
import AddStepButton from "./AddStepButton.vue";

const props = defineProps({
  nodes: { type: Array, required: true },
  context: { type: Object, required: true }
});

const startPosition = computed(() =>
  props.context.kind === "branch" ? { branch: { ifStepId: props.context.ifStepId, outcome: props.context.outcome } } : {}
);
</script>

<style scoped lang="scss">
.sequence {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.branches {
  display: flex;
  gap: var(--catnip-space-32);
  margin-top: var(--catnip-space-2);
  padding: var(--catnip-space-3) var(--catnip-space-4) 0;
  border-top: 2px solid var(--catnip-color-border-neutral-subtle);
  border-bottom: 2px solid var(--catnip-color-border-neutral-subtle);
}

.branch {
  display: flex;
  flex-direction: column;
  align-items: center;
  min-width: 260px;
  padding-bottom: var(--catnip-space-3);
}
</style>
