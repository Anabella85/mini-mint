import { defineStore } from "pinia";

let nextToastId = 1;

export const useUiStore = defineStore("ui", {
  state: () => ({
    toasts: []
  }),
  actions: {
    notify({ intent = "informative", text, duration = 4000 }) {
      const id = nextToastId++;
      this.toasts.push({ id, intent, text });
      if (duration) setTimeout(() => this.dismiss(id), duration);
    },
    dismiss(id) {
      this.toasts = this.toasts.filter((t) => t.id !== id);
    }
  }
});
