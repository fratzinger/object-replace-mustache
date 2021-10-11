import assert from "assert";
import omr, { ObjectReplaceMustacheOptions } from "../src/index";

describe("index", function() {
  it("exports all members", function() {
    assert.ok(omr);
    const options: ObjectReplaceMustacheOptions = {
      clone: true
    }
    assert.ok(options);
  });
});