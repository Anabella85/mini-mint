<template>
    <catnip-dialog .open="!!pending" .dialogTitle="pending ? `Delete “${pending.displayName}”?` : ''"
        description="Other steps use values from this step. After you delete it, those references will not work."
        .closable="true" @close-dialog="editor.cancelDelete()">
        <ul v-if="pending" class="usages">
            <li v-for="usage in pending.usages" :key="usage.stepId">
                <strong>{{ usage.displayName }}</strong>
                <span class="outputs">uses {{ usage.outputs.join(", ") }}</span>
            </li>
        </ul>
        <div slot="footer" class="actions">
            <catnip-button appearance="secondary" size="s" @click="editor.cancelDelete()">Cancel</catnip-button>
            <catnip-button appearance="primary" intent="danger" size="s" @click="editor.confirmDelete()">Delete
                step</catnip-button>
        </div>
    </catnip-dialog>
</template>
<script setup>
import { computed } from "vue";
import { useEditorStore } from "@/store/editor.js";

const editor = useEditorStore();
const pending = computed(() => editor.pendingDelete);
</script>
<style scoped lang="scss">
.usages {
    margin: 0;
    padding-left: var(--catnip-space-4);

    li+li {
        margin-top: var(--catnip-space-2);
    }
}

.outputs {
    display: block;
    font: var(--catnip-font-text-s);
    color: var(--catnip-color-content-neutral-subtle);
}

.actions {
    display: flex;
    justify-content: flex-end;
    gap: var(--catnip-space-2);
}
</style>