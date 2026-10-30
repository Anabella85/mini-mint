<template>
  <div class="reference-picker">
    <catnip-alert
      appearance="inline"
      intent="informative"
      description="TODO (Feature A): list the step outputs that this step can use, and emit the chosen reference."
    ></catnip-alert>
  </div>
</template>

<script setup>
defineProps({
  /** The step that will receive the reference. */
  stepId: { type: String, required: true }
});

/** Emit `select` with a reference string, e.g. makeReference(stepId, outputKey) from logic/references.js */
defineEmits(["select"]);
</script>

<style scoped lang="scss">
.reference-picker {
  margin-top: var(--catnip-space-2);
}
</style>
