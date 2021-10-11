import assert from "assert";
import replace from "../src/object-replace-mustache";

describe("replace", function() {
  describe("object", function() {
    it("doesn't change item", function() {
      const transformed = replace({
        test: true
      }, { test: false });
      assert.deepStrictEqual(transformed, { test: true }, "item hasn't changed");
    });
  
    it("changes item", function() {
      const transformed = replace({
        test: "{{ test }}"
      }, { test: true });
      assert.deepStrictEqual(transformed, { test: true }, "item changed");
    });

    it("creates new object by default", function() {
        const original = { test: "{{ test }}" };
        const transformed = replace(original, { test: true });
        assert.deepStrictEqual(original, { test: "{{ test }}" }, "original unchanged");
        assert.deepStrictEqual(transformed, { test: true }, "item changed");
      })

    it("overwrites item with clone: false", function() {
      const original = { test: "{{ test }}" };
      const transformed = replace(original, { test: true }, { clone: false });
      assert.deepStrictEqual(original, { test: true }, "original changed");
      assert.deepStrictEqual(transformed, { test: true }, "item changed");
    })
  
    it("doesn't change item with mustache not starting", function() {
      const transformed = replace({
        test: "hi {{ test }}"
      }, { test: false });
      assert.deepStrictEqual(transformed, { test: "hi {{ test }}" }, "item hasn't changed");
    });
  
    it("doesn't change item with mustache not ending", function() {
      const transformed = replace({
        test: "{{ test }} hi"
      }, { test: false });
      assert.deepStrictEqual(transformed, { test: "{{ test }} hi" }, "item hasn't changed");
    });
  
    it("works with no whitespaces", function() {
      const transformed = replace({
        test: "{{test}}"
      }, { test: true });
      assert.deepStrictEqual(transformed, { test: true }, "item has changed");
    });
  
    it("doesn't work with leading and trailing whitespaces", function() {
      const transformed = replace({
        test: "   {{ test }}    "
      }, { test: true });
      assert.deepStrictEqual(transformed, { test: "   {{ test }}    " }, "item hasn't changed");
    });
  
    it("works with multiple whitespaces", function() {
      const transformed = replace({
        test: "{{   test      }}"
      }, { test: true });
      assert.deepStrictEqual(transformed, { test: true }, "item has changed");
    });
  
    it("doesn't work with nested mustache", function() {
      const transformed = replace({
        test: "{{ {{ test }} }}"
      }, { test: true });
      assert.deepStrictEqual(transformed, { test: "{{ {{ test }} }}" }, "item hasn't changed");
    });
  
    it("doesn't change if view isn't existent", function() {
      const transformed = replace({
        test: "{{ test }}"
      }, { test2: true });
      assert.deepStrictEqual(transformed, { test: "{{ test }}" }, "item hasn't changed");
    });
  
    it("changes array items", function() {
      const transformed = replace({
        items: [{ test: "{{ test }}" }]
      }, { test: true });
      assert.deepStrictEqual(transformed, { items: [ { test: true }] }, "array item changed");
    });
  
    it("changes nested property with dot.notation", function() {
      const transformed = replace({
        test: "{{ test.test.test }}"
      }, { test: { test: { test: true } } });
      assert.deepStrictEqual(transformed, { test: true }, "array item changed");
    });
  });
});