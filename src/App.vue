<template>
  <div class="app">
    <header class="topbar">
      <div class="brand">
        <catnip-icon name="flow" size="20"></catnip-icon>
        <span>mini-mint</span>
      </div>
      <template v-if="editor.flow">
        <h1 class="flow-name">{{ editor.flow.name }}</h1>
        <catnip-badge intent="neutral" size="s">v{{ editor.flow.version }}</catnip-badge>
        <catnip-badge v-if="editor.isDirty" intent="warning" size="s">Unsaved changes</catnip-badge>
      </template>
      <div class="spacer" />
      <catnip-toggle .modelValue="collaboratorActive" @update:modelValue="collaboratorActive = eventValue($event)">
        Simulate colleague
      </catnip-toggle>
      <catnip-button appearance="ghost" size="s" left-icon="refresh" @click="resetDemoData">Reset demo data</catnip-button>
      <catnip-button appearance="secondary" size="s" .disabled="!editor.isDirty" @click="editor.discard()">Discard</catnip-button>
      <catnip-button
        appearance="primary"
        size="s"
        .disabled="!editor.flow || editor.saving"
        .loading="editor.saving"
        @click="editor.save()"
      >
        Save
      </catnip-button>
    </header>

    <main class="layout">
      <FlowList />
      <section class="canvas-area">
        <div v-if="editor.loading" class="placeholder">
          <catnip-spinner size="32"></catnip-spinner>
          <span>Loading flow…</span>
        </div>
        <FlowCanvas v-else-if="editor.flow" />
        <div v-else class="placeholder">
          <catnip-icon name="flow" size="32"></catnip-icon>
          <span>Pick a flow on the left.</span>
        </div>
      </section>
      <StepSidebar v-if="editor.selectedStep" :key="editor.selectedStep.id" />
    </main>

    <ToastHost />
  </div>
</template>

<script setup>
import { ref, watch } from "vue";
import { api } from "@/api";
import { useEditorStore } from "@/store/editor.js";
import { eventValue } from "@/logic/catnip.js";
import FlowList from "@/components/FlowList.vue";
import FlowCanvas from "@/components/FlowCanvas.vue";
import StepSidebar from "@/components/StepSidebar.vue";
import ToastHost from "@/components/ToastHost.vue";

const editor = useEditorStore();
const collaboratorActive = ref(false);

watch(collaboratorActive, (active) => api.setCollaboratorActive(active));

function resetDemoData() {
  if (!window.confirm("Reset all flows to the demo data? Your saved changes will be lost.")) return;
  api.resetDemoData();
  window.location.reload();
}
</script>

<style scoped lang="scss">
.app {
  display: flex;
  flex-direction: column;
  height: 100vh;
}

.topbar {
  display: flex;
  align-items: center;
  gap: var(--catnip-space-3);
  padding: var(--catnip-space-3) var(--catnip-space-4);
  background: var(--catnip-color-background-neutral-subtlest);
  border-bottom: 1px solid var(--catnip-color-border-neutral-subtlest);
}

.brand {
  display: flex;
  align-items: center;
  gap: var(--catnip-space-2);
  font-weight: 600;
  color: var(--catnip-color-content-primary-strong);
  margin-right: var(--catnip-space-4);
}

.flow-name {
  font: var(--catnip-font-heading-s);
  margin: 0;
}

.spacer {
  flex: 1;
}

.layout {
  flex: 1;
  display: flex;
  min-height: 0;
}

.canvas-area {
  flex: 1;
  overflow: auto;
}

.placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--catnip-space-3);
  margin-top: var(--catnip-space-64);
  color: var(--catnip-color-content-neutral-subtle);
}
</style>
