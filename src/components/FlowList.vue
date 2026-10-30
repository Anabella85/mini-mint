<template>
  <nav class="flow-list" aria-label="Flows">
    <h2>Flows</h2>
    <template v-if="flows.loading && !flows.items.length">
      <catnip-skeleton v-for="n in 4" :key="n" height="44px" class="skeleton"></catnip-skeleton>
    </template>
    <catnip-list v-else>
      <catnip-list-item
        v-for="flow in flows.items"
        :key="flow.id"
        .selected="flow.id === editor.activeFlowId"
        @click="editor.openFlow(flow.id)"
      >
        <catnip-icon slot="left" name="flow" size="20"></catnip-icon>
        <div class="flow">
          <span class="name">{{ flow.name }}</span>
          <span class="meta">{{ flow.stepCount }} steps · updated {{ formatDate(flow.updatedAt) }}</span>
        </div>
      </catnip-list-item>
    </catnip-list>
  </nav>
</template>

<script setup>
import { onMounted } from "vue";
import { useFlowsStore } from "@/store/flows.js";
import { useEditorStore } from "@/store/editor.js";

const flows = useFlowsStore();
const editor = useEditorStore();

onMounted(() => flows.fetchFlows());

function formatDate(iso) {
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}
</script>

<style scoped lang="scss">
.flow-list {
  width: 280px;
  flex-shrink: 0;
  overflow: auto;
  padding: var(--catnip-space-4) var(--catnip-space-3);
  background: var(--catnip-color-background-neutral-subtlest);
  border-right: 1px solid var(--catnip-color-border-neutral-subtlest);

  h2 {
    font: var(--catnip-font-text-s);
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: var(--catnip-color-content-neutral-subtle);
    margin: 0 var(--catnip-space-2) var(--catnip-space-3);
  }
}

.skeleton {
  display: block;
  margin-bottom: var(--catnip-space-2);
}

.flow {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.name {
  font-weight: 600;
}

.meta {
  font: var(--catnip-font-text-s);
  color: var(--catnip-color-content-neutral-subtle);
}
</style>
