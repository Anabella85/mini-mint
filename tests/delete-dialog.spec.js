import { describe, expect, it } from "vitest";
import { mount } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import { useEditorStore } from "@/store/editor.js";
import DeleteStepDialog from "@/components/DeleteStepDialog.vue";

describe("DeleteStepDialog", () => {
  function setup() {
    setActivePinia(createPinia());
    const editor = useEditorStore();
    editor.pendingDelete = {
      stepId: "s1",
      displayName: "Verify identity",
      usages: [{ stepId: "s2", displayName: "Welcome email", outputs: ["Full name"] }]
    };
    return { editor, wrapper: mount(DeleteStepDialog) };
  }

  it("is open and lists the steps that use the outputs", () => {
    const { wrapper } = setup();
    expect(wrapper.find("catnip-dialog").element.open).toBe(true);
    expect(wrapper.find("li").text()).toContain("Welcome email");
    expect(wrapper.find("li").text()).toContain("uses Full name");
  });

  it("cancels when the dialog is closed with Escape or the close button", async () => {
    const { editor, wrapper } = setup();
    await new Promise((resolve) => setTimeout(resolve, 0));
    wrapper.find("catnip-dialog").element.dispatchEvent(new CustomEvent("close-dialog"));
    expect(editor.pendingDelete).toBe(null);
  });
});