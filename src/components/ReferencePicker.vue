<template>
  <div class="reference-picker">
    <catnip-alert v-if="!groups.length" appearance="inline" intent="informative"
      description="No earlier steps with outputs available." />

    <section v-for="group in groups" :key="group.step.id" class="group">
      <h4>
        <catnip-icon .name="getStepIcon(group.step.type)" size="16" />
        {{ group.step.displayName }}
      </h4>
      <catnip-list size="s">
        <catnip-list-item v-for="output in group.outputs" :key="output.key" @click="emit('select', output.reference)">
          {{ output.label }}
        </catnip-list-item>
      </catnip-list>
    </section>
  </div>
</template>

<script setup>
import { computed } from "vue";
import { useEditorStore } from "@/store/editor.js";
import { getAvailableOutputs } from "@/logic/references.js";
import { getStepIcon } from "@/logic/stepTypes.js";

const props = defineProps({
  /** The step that will receive the reference. */
  stepId: { type: String, required: true }
});

/** Emit `select` with a reference string, e.g. makeReference(stepId, outputKey) from logic/references.js */
const emit = defineEmits(["select"]);

const editor = useEditorStore();
const groups = computed(() => editor.flow ? getAvailableOutputs(editor.flow, props.stepId) : []);
</script>
<style scoped lang="scss">
.reference-picker {
  margin-top: var(--catnip-space-2);
  padding: var(--catnip-space-2);
  border: 1px solid var(--catnip-color-border-neutral-subtle);
  border-radius: var(--catnip-radius-m);
}

.group+.group {
  margin-top: var(--catnip-space-3);
}

h4 {
  display: flex;
  align-items: center;
  gap: var(--catnip-space-2);
  margin: 0 0 var(--catnip-space-1);
  padding: 0 var(--catnip-space-2);
  font: var(--catnip-font-text-s);
  font-weight: 600;
  color: var(--catnip-color-content-neutral-subtle);
}
</style>