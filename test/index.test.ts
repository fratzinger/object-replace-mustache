import * as src from "../src";

describe("index", function () {
  it("exports all members", function () {
    const members = Object.keys(src).sort();
    assert.deepStrictEqual(
      members,
      [
        "delimiters",
        "isTemplateString",
        "render",
        "replace",
        "replaceString",
        "replaceStringEjs",
        "replaceStringMustache",
      ].sort(),
    );
  });
});
