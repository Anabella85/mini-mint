import { describe, expect, it } from "vitest";
import { sanitizeNote } from "@/logic/sanitize.js";

describe("sanitizeNote", () => {
  it("keeps basic formatting", () => {
    expect(sanitizeNote("<b>Heads up:</b> BankID only")).toBe("<b>Heads up:</b> BankID only");
  });

  it("removes scripts, event handlers and links", () => {
    expect(sanitizeNote('<img src=x onerror="alert(1)"><script>alert(2)</script><a href="javascript:x">hi</a>')).toBe("hi");
    expect(sanitizeNote('<b onclick="alert(1)">x</b>')).toBe("<b>x</b>");
  });

  it("handles a missing note", () => {
    expect(sanitizeNote(undefined)).toBe("");
  });
});