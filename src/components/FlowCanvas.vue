<template>
  <div class="canvas">
    <span class="terminal">Start</span>
    <StepSequence :nodes="editor.tree" :context="{ kind: 'root' }" />
    <span class="terminal">End</span>
  </div>
</template>

<script setup>
import { useEditorStore } from "@/store/editor.js";
import StepSequence from "./StepSequence.vue";

const editor = useEditorStore();
</script>

<style scoped lang="scss">
.canvas {
  display: flex;
  flex-direction: column;
  align-items: center;
  min-width: max-content;
  padding: var(--catnip-space-32) var(--catnip-space-24) 120px;
  background-image: radial-gradient(var(--catnip-color-border-neutral-subtle) 1px, transparent 1px);
  background-size: 20px 20px;
}

.terminal {
  font: var(--catnip-font-text-s);
  font-weight: 600;
  color: var(--catnip-color-content-neutral-subtle);
  padding: var(--catnip-space-1) var(--catnip-space-4);
  border: 1px dashed var(--catnip-color-border-neutral-strong);
  border-radius: var(--catnip-radius-round);
  background: var(--catnip-color-background-neutral-subtlest);
}
</style>
