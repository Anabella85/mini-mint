<template>
  <aside class="sidebar">
    <header>
      <span class="title">
        <catnip-icon .name="getStepIcon(step.type)" size="20"></catnip-icon>
        {{ getStepTypeLabel(step.type) }}
      </span>
      <catnip-button appearance="ghost" size="s" left-icon="close" aria-label="Close" @click="editor.selectStep(null)"></catnip-button>
    </header>

    <div class="field">
      <catnip-input label="Name" .modelValue="step.displayName" @update:modelValue="step.displayName = eventValue($event)"></catnip-input>
    </div>

    <div class="field">
      <catnip-input
        type="textarea"
        label="Note"
        info="Basic HTML formatting is allowed"
        rows="2"
        .modelValue="step.note ?? ''"
        @update:modelValue="step.note = eventValue($event)"
      ></catnip-input>
    </div>

    <catnip-divider decorative size="s"></catnip-divider>
    <h4>Properties</h4>

    <template v-for="(value, key) in step.properties" :key="key">
      <!-- Form fields -->
      <div v-if="key === 'fields'" class="field">
        <catnip-field-label>Fields</catnip-field-label>
        <div v-for="(formField, index) in value" :key="index" class="form-field-row">
          <catnip-input
            size="s"
            label="Key"
            hide-label
            placeholder="key"
            .modelValue="formField.key"
            @update:modelValue="formField.key = eventValue($event)"
          ></catnip-input>
          <catnip-input
            size="s"
            label="Label"
            hide-label
            placeholder="Label"
            .modelValue="formField.label"
            @update:modelValue="formField.label = eventValue($event)"
          ></catnip-input>
          <catnip-button appearance="ghost" size="s" left-icon="delete" aria-label="Remove field" @click="value.splice(index, 1)"></catnip-button>
        </div>
        <catnip-button appearance="secondary" size="s" left-icon="plus" class="align-start" @click="value.push({ key: '', label: '' })">
          Add field
        </catnip-button>
      </div>

      <!-- Plain text -->
      <div v-else-if="typeof value === 'string'" class="field">
        <catnip-input
          .label="humanize(key)"
          .type="MULTILINE_KEYS.includes(key) ? 'textarea' : 'text'"
          .modelValue="value"
          @update:modelValue="step.properties[key] = eventValue($event)"
        ></catnip-input>
        <catnip-button appearance="ghost" size="s" left-icon="link" class="align-start" @click="togglePicker(key)">
          {{ openPickerFor === key ? "Close" : "Insert reference" }}
        </catnip-button>
        <ReferencePicker v-if="openPickerFor === key" :step-id="step.id" @select="insertReference(key, $event)" />
      </div>

      <!-- Nested objects (e.g. webhook body) -->
      <div v-else class="field">
        <catnip-field-label info="JSON">{{ humanize(key) }}</catnip-field-label>
        <textarea
          :value="JSON.stringify(value, null, 2)"
          rows="8"
          class="code"
          :aria-label="humanize(key)"
          @change="updateJson(key, $event.target.value)"
        />
        <catnip-alert v-if="jsonErrors[key]" appearance="text" intent="danger" .description="jsonErrors[key]"></catnip-alert>
      </div>
    </template>

    <footer>
      <catnip-button appearance="ghost" intent="danger" size="s" left-icon="delete" @click="editor.deleteStep(step.id)">
        Delete step
      </catnip-button>
    </footer>
  </aside>
</template>

<script setup>
import { computed, reactive, ref } from "vue";
import { useEditorStore } from "@/store/editor.js";
import { getStepIcon, getStepTypeLabel } from "@/logic/stepTypes.js";
import { eventValue } from "@/logic/catnip.js";
import ReferencePicker from "./ReferencePicker.vue";

const MULTILINE_KEYS = ["body", "condition"];

const editor = useEditorStore();
const step = computed(() => editor.selectedStep);
const openPickerFor = ref(null);
const jsonErrors = reactive({});

function humanize(key) {
  return key.replace(/([A-Z])/g, " $1").replace(/^./, (c) => c.toUpperCase());
}

function togglePicker(key) {
  openPickerFor.value = openPickerFor.value === key ? null : key;
}

function insertReference(key, reference) {
  const current = step.value.properties[key] ?? "";
  step.value.properties[key] = current ? `${current} ${reference}` : reference;
  openPickerFor.value = null;
}

function updateJson(key, text) {
  try {
    step.value.properties[key] = JSON.parse(text);
    delete jsonErrors[key];
  } catch (error) {
    jsonErrors[key] = `Invalid JSON: ${error.message}`;
  }
}
</script>

<style scoped lang="scss">
.sidebar {
  width: 360px;
  flex-shrink: 0;
  overflow: auto;
  padding: var(--catnip-space-4);
  background: var(--catnip-color-background-neutral-subtlest);
  border-left: 1px solid var(--catnip-color-border-neutral-subtlest);

  header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: var(--catnip-space-4);
  }

  h4 {
    margin: var(--catnip-space-4) 0 var(--catnip-space-3);
    font: var(--catnip-font-text-s);
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: var(--catnip-color-content-neutral-subtle);
  }

  footer {
    margin-top: var(--catnip-space-24);
  }
}

.title {
  display: flex;
  align-items: center;
  gap: var(--catnip-space-2);
  font: var(--catnip-font-heading-xs);
}

.field {
  display: flex;
  flex-direction: column;
  gap: var(--catnip-space-1);
  margin-bottom: var(--catnip-space-4);
}

.form-field-row {
  display: flex;
  align-items: center;
  gap: var(--catnip-space-2);
  margin-bottom: var(--catnip-space-1);

  catnip-input {
    flex: 1;
    min-width: 0;
  }
}

.align-start {
  align-self: flex-start;
}

.code {
  width: 100%;
  padding: var(--catnip-space-2);
  font-family: var(--catnip-font-family-code, monospace);
  font-size: 12px;
  color: var(--catnip-color-content-neutral-strongest);
  background: var(--catnip-color-background-neutral-subtle);
  border: 1px solid var(--catnip-color-border-neutral-strong);
  border-radius: var(--catnip-radius-s);
  resize: vertical;
}
</style>
