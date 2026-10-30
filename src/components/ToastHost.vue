<template>
  <!-- Catnip toasts don't stack, so only the most recent one is shown. -->
  <catnip-toast
    v-if="latest"
    :key="latest.id"
    .intent="latest.intent"
    .description="latest.text"
    .duration="'persistent'"
    announcement="polite"
    @dismiss="ui.dismiss(latest.id)"
  ></catnip-toast>
</template>

<script setup>
import { computed } from "vue";
import { useUiStore } from "@/store/ui.js";

const ui = useUiStore();
const latest = computed(() => ui.toasts.at(-1));
</script>
