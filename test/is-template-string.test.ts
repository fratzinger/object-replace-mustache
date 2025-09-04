import { isTemplateString } from "../src";

describe("isTemplateString", () => {
  it("should work", () => {
    expect(isTemplateString("{{test}}")).toBe(true);
    expect(isTemplateString("test")).toBe(false);
    expect(isTemplateString("")).toBe(false);
    expect(isTemplateString(null)).toBe(false);
    expect(isTemplateString(0)).toBe(false);
    expect(isTemplateString(undefined)).toBe(false);
    expect(isTemplateString("test {{}}")).toBe(false);
  });

  it("custom delimiters", () => {
    expect(isTemplateString("[test]", { delimiters: ["[", "]"] })).toBe(true);
    expect(isTemplateString("{{test}}", { delimiters: ["[", "]"] })).toBe(false);
  });
});