<template>
  <article class="step-card" :class="{ selected: editor.selectedStepId === step.id }" @click="editor.selectStep(step.id)">
    <span class="icon">
      <catnip-icon .name="getStepIcon(step.type)" size="20"></catnip-icon>
    </span>
    <div class="body">
      <span class="type">{{ getStepTypeLabel(step.type) }}</span>
      <h3>{{ step.displayName }}</h3>
      <p v-if="step.note" class="note" v-html="step.note" />
    </div>
    <catnip-button
      class="remove"
      appearance="ghost"
      size="xs"
      purpose="utility"
      left-icon="delete"
      aria-label="Delete step"
      @click.stop="editor.deleteStep(step.id)"
    ></catnip-button>
  </article>
</template>

<script setup>
import { useEditorStore } from "@/store/editor.js";
import { getStepIcon, getStepTypeLabel } from "@/logic/stepTypes.js";

defineProps({
  step: { type: Object, required: true }
});

const editor = useEditorStore();
</script>

<style scoped lang="scss">
.step-card {
  display: flex;
  align-items: flex-start;
  gap: var(--catnip-space-3);
  width: 260px;
  padding: var(--catnip-space-3);
  cursor: pointer;
  background: var(--catnip-color-background-neutral-subtlest);
  border: 1px solid var(--catnip-color-border-neutral-subtle);
  border-radius: var(--catnip-radius-m);
  box-shadow: var(--catnip-shadow-elevation-1);
  transition: border-color 0.15s, box-shadow 0.15s;

  &:hover {
    border-color: var(--catnip-color-border-neutral-strong);
    box-shadow: var(--catnip-shadow-elevation-2);
  }

  &.selected {
    border-color: var(--catnip-color-border-primary-strong);
    box-shadow: var(--catnip-shadow-focus-default);
  }
}

.icon {
  display: grid;
  place-items: center;
  flex-shrink: 0;
  width: 36px;
  height: 36px;
  border-radius: var(--catnip-radius-s);
  color: var(--catnip-color-content-primary-strong);
  background: var(--catnip-color-background-primary-subtler);
}

.body {
  flex: 1;
  min-width: 0;

  h3 {
    margin: 2px 0 0;
    font: var(--catnip-font-heading-xs);
  }
}

.type {
  font: var(--catnip-font-text-s);
  color: var(--catnip-color-content-neutral-subtle);
}

.note {
  margin: var(--catnip-space-2) 0 0;
  font: var(--catnip-font-text-s);
  color: var(--catnip-color-content-neutral-strong);
}

.remove {
  flex-shrink: 0;
  margin: -4px -4px 0 0;
}
</style>
