import { defineStore } from "pinia";
import { api } from "@/api";

export const useFlowsStore = defineStore("flows", {
  state: () => ({
    items: [],
    loading: false
  }),
  actions: {
    async fetchFlows() {
      this.loading = true;
      try {
        this.items = await api.listFlows();
      } finally {
        this.loading = false;
      }
    }
  }
});
