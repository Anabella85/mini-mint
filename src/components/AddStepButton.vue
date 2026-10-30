<template>
  <div ref="root" class="add-step">
    <div class="line" />
    <catnip-button
      appearance="secondary"
      size="xs"
      purpose="utility"
      left-icon="plus"
      aria-label="Add step"
      .selected="open"
      @click="open = !open"
    ></catnip-button>
    <div class="line" />
    <div v-if="open" class="menu">
      <catnip-list role="menu" size="m">
        <catnip-list-item v-for="type in ADDABLE_STEP_TYPES" :key="type" @click="add(type)">
          <catnip-icon slot="left" .name="getStepIcon(type)" size="20"></catnip-icon>
          {{ getStepTypeLabel(type) }}
        </catnip-list-item>
      </catnip-list>
    </div>
  </div>
</template>

<script setup>
import { onBeforeUnmount, ref, watch } from "vue";
import { useEditorStore } from "@/store/editor.js";
import { ADDABLE_STEP_TYPES, getStepIcon, getStepTypeLabel } from "@/logic/stepTypes.js";

const props = defineProps({
  position: { type: Object, required: true }
});

const editor = useEditorStore();
const open = ref(false);
const root = ref(null);

function add(type) {
  editor.addStep(type, props.position);
  open.value = false;
}

// close when clicking anywhere else (composedPath also sees clicks inside Catnip's shadow DOM)
function onDocumentPointerDown(event) {
  if (!event.composedPath().includes(root.value)) open.value = false;
}

watch(open, (isOpen) => {
  if (isOpen) document.addEventListener("pointerdown", onDocumentPointerDown);
  else document.removeEventListener("pointerdown", onDocumentPointerDown);
});

onBeforeUnmount(() => document.removeEventListener("pointerdown", onDocumentPointerDown));
</script>

<style scoped lang="scss">
.add-step {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.line {
  width: 2px;
  height: var(--catnip-space-3);
  background: var(--catnip-color-border-neutral-subtle);
}

.menu {
  position: absolute;
  top: 44px;
  z-index: 10;
  min-width: 200px;
  padding: var(--catnip-space-1);
  background: var(--catnip-color-background-neutral-subtlest);
  border: 1px solid var(--catnip-color-border-neutral-subtle);
  border-radius: var(--catnip-radius-m);
  box-shadow: var(--catnip-shadow-elevation-3);
}
</style>
