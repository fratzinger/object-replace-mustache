import assert from "node:assert";
import { replace } from "../src";

describe("replace-object.test.ts", () => {
  describe("object", function () {
    it("doesn't change item", function () {
      const transformed = replace(
        {
          test: true,
        },
        { test: false },
      );
      assert.deepStrictEqual(
        transformed,
        { test: true },
        "item hasn't changed",
      );
    });

    it("changes item", function () {
      const transformed = replace(
        {
          test: "{{ test }}",
        },
        { test: true },
      );
      assert.deepStrictEqual(transformed, { test: true }, "item changed");
    });

    it("creates new object by default", function () {
      const original = { test: "{{ test }}" };
      const transformed = replace(original, { test: true });
      assert.deepStrictEqual(
        original,
        { test: "{{ test }}" },
        "original unchanged",
      );
      assert.deepStrictEqual(transformed, { test: true }, "item changed");
    });

    it("doesn't change item with mustache not starting", function () {
      const transformed = replace(
        {
          test: "hi {{ test }}",
        },
        { test: false },
      );
      assert.deepStrictEqual(
        transformed,
        { test: "hi {{ test }}" },
        "item hasn't changed",
      );
    });

    it("doesn't change item with mustache not ending", function () {
      const transformed = replace(
        {
          test: "{{ test }} hi",
        },
        { test: false },
      );
      assert.deepStrictEqual(
        transformed,
        { test: "{{ test }} hi" },
        "item hasn't changed",
      );
    });

    it("works with no whitespaces", function () {
      const transformed = replace(
        {
          test: "{{test}}",
        },
        { test: true },
      );
      assert.deepStrictEqual(transformed, { test: true }, "item has changed");
    });

    it("doesn't work with leading and trailing whitespaces", function () {
      const transformed = replace(
        {
          test: "   {{ test }}    ",
        },
        { test: true },
      );
      assert.deepStrictEqual(
        transformed,
        { test: "   {{ test }}    " },
        "item hasn't changed",
      );
    });

    it("works with multiple whitespaces", function () {
      const transformed = replace(
        {
          test: "{{   test      }}",
        },
        { test: true },
      );
      assert.deepStrictEqual(transformed, { test: true }, "item has changed");
    });

    it("doesn't change if view isn't existent", function () {
      const transformed = replace(
        {
          test: "{{ test }}",
        },
        { test2: true },
      );
      assert.deepStrictEqual(
        transformed,
        { test: "{{ test }}" },
        "item hasn't changed",
      );
    });

    it("changes array items", function () {
      const transformed = replace(
        {
          items: [{ test: "{{ test }}" }],
        },
        { test: true },
      );
      assert.deepStrictEqual(
        transformed,
        { items: [{ test: true }] },
        "array item changed",
      );
    });

    it("changes nested property with dot.notation", function () {
      const transformed = replace(
        {
          test: "{{ test.test.test }}",
        },
        { test: { test: { test: true } } },
      );
      assert.deepStrictEqual(transformed, { test: true }, "array item changed");
    });

    it("fallback if not defined", function () {
      const transformed = replace(
        {
          test: "{{ test ?? undefined }}",
        },
        {},
        { handleError: "ignore" },
      );
      assert.deepStrictEqual(transformed, { test: "{{ test ?? undefined }}" });
    });
  });

  describe("number", function () {
    it("does not change number", function () {
      // @ts-expect-error this is a test
      const transformed = replace(1, { test: false });
      assert.deepStrictEqual(transformed, 1, "number hasn't changed");
    });
  });

  describe("array", function () {
    it("handles empty array", function () {
      const original: any[] = [];
      const transformed = replace(original, { test: false });
      assert.deepStrictEqual(transformed, [], "empty array doesn't change");
      assert.ok(transformed !== original, "makes a copy");
    });

    it("handles array of values", function () {
      const original = [
        "{{ test }}",
        "test",
        1,
        {
          test: "{{ test }}",
          arr: ["{{ test }}", "test", 1, { test: "{{ test }}" }],
        },
      ];

      const expected = [
        true,
        "test",
        1,
        {
          test: true,
          arr: [true, "test", 1, { test: true }],
        },
      ];
      const transformed = replace(original, { test: true });
      assert.deepStrictEqual(transformed, expected, "transforms array");
      assert.ok(transformed !== original, "makes a copy");
    });
  });

  describe("other values", function () {
    it("works with 'null'", function () {
      // @ts-expect-error - this is a test
      const transformed = replace(null, { test: false });
      assert.deepStrictEqual(transformed, null, "is null");
    });

    it("works with 'undefined'", function () {
      // @ts-expect-error - this is a test
      const transformed = replace(undefined, { test: false });
      assert.deepStrictEqual(transformed, undefined, "is undefined");
    });

    it("works with Date", function () {
      const date = new Date();
      const transformed = replace(date, { test: false });
      assert.deepStrictEqual(transformed, date, "is Date");
    });
  });

  describe("github issues", () => {
    // see https://github.com/fratzinger/object-replace-mustache/issues/2
    it("#2", () => {
      // 1) primitive types (string, number, boolean, undefined, ...)
      expect(
        replace(
          {
            url: '{{ "https://example.com/v" + versionNumber + "/" + resource }}',
          },
          { versionNumber: 1, resource: "users" },
        ),
      ).toStrictEqual({
        url: "https://example.com/v1/users",
      });
    });
  });

  describe("custom delimiters", () => {
    it("should work with custom delimiters", () => {
      const transformed = replace(
        {
          test: "<%=value%>",
        },
        { value: "hello" },
        { delimiters: ["<%=", "%>"] },
      );
      assert.deepStrictEqual(transformed, { test: "hello" });
    });

    it("should work with custom delimiters in nested objects", () => {
      const transformed = replace(
        {
          outer: {
            inner: "<%=value%>",
          },
        },
        { value: "nested" },
        { delimiters: ["<%=", "%>"] },
      );
      assert.deepStrictEqual(transformed, {
        outer: { inner: "nested" },
      });
    });

    it("should work with custom delimiters in deeply nested structures", () => {
      const transformed = replace(
        {
          level1: {
            level2: {
              level3: {
                value: "<%=test%>",
              },
            },
          },
        },
        { test: "deep" },
        { delimiters: ["<%=", "%>"] },
      );
      assert.deepStrictEqual(transformed, {
        level1: {
          level2: {
            level3: {
              value: "deep",
            },
          },
        },
      });
    });

    it("should work with custom delimiters in arrays within objects", () => {
      const transformed = replace(
        {
          items: ["<%=first%>", "<%=second%>"],
        },
        { first: "a", second: "b" },
        { delimiters: ["<%=", "%>"] },
      );
      assert.deepStrictEqual(transformed, {
        items: ["a", "b"],
      });
    });
  });

  describe("error handling", () => {
    it("should ignore errors by default", () => {
      const transformed = replace(
        {
          test: "{{ undefinedVariable }}",
        },
        {},
      );
      assert.deepStrictEqual(transformed, { test: "{{ undefinedVariable }}" });
    });

    it("should throw errors when handleError is 'throw'", () => {
      expect(() => {
        replace(
          {
            test: "{{ undefinedVariable }}",
          },
          {},
          { handleError: "throw" },
        );
      }).toThrow();
    });

    it("should handle errors in nested objects when handleError is 'throw'", () => {
      expect(() => {
        replace(
          {
            outer: {
              inner: "{{ undefinedVariable }}",
            },
          },
          {},
          { handleError: "throw" },
        );
      }).toThrow();
    });

    it("should ignore errors in nested objects by default", () => {
      const transformed = replace(
        {
          outer: {
            inner: "{{ undefinedVariable }}",
          },
        },
        {},
      );
      assert.deepStrictEqual(transformed, {
        outer: { inner: "{{ undefinedVariable }}" },
      });
    });

    it("should handle errors in deeply nested structures", () => {
      const transformed = replace(
        {
          level1: {
            level2: {
              level3: "{{ missing }}",
            },
          },
        },
        {},
        { handleError: "ignore" },
      );
      assert.deepStrictEqual(transformed, {
        level1: {
          level2: {
            level3: "{{ missing }}",
          },
        },
      });
    });
  });

  describe("complex nested structures", () => {
    it("should handle deeply nested objects (5+ levels)", () => {
      const transformed = replace(
        {
          l1: {
            l2: {
              l3: {
                l4: {
                  l5: "{{ value }}",
                },
              },
            },
          },
        },
        { value: "deep" },
      );
      assert.deepStrictEqual(transformed, {
        l1: {
          l2: {
            l3: {
              l4: {
                l5: "deep",
              },
            },
          },
        },
      });
    });

    it("should handle arrays containing objects containing arrays", () => {
      const transformed = replace(
        {
          items: [
            {
              nested: ["{{ a }}", "{{ b }}"],
            },
            {
              nested: ["{{ c }}"],
            },
          ],
        },
        { a: 1, b: 2, c: 3 },
      );
      assert.deepStrictEqual(transformed, {
        items: [
          {
            nested: [1, 2],
          },
          {
            nested: [3],
          },
        ],
      });
    });

    it("should handle mixed templates and non-templates in nested structures", () => {
      const transformed = replace(
        {
          mixed: {
            template: "{{ value }}",
            static: "no-template",
            number: 42,
            nested: {
              another: "{{ another }}",
              plain: "plain",
            },
          },
        },
        { value: "replaced", another: "also-replaced" },
      );
      assert.deepStrictEqual(transformed, {
        mixed: {
          template: "replaced",
          static: "no-template",
          number: 42,
          nested: {
            another: "also-replaced",
            plain: "plain",
          },
        },
      });
    });
  });

  describe("special object types", () => {
    it("should handle Object.create(null)", () => {
      const obj = Object.create(null);
      obj.test = "{{ value }}";
      const transformed = replace(obj, { value: "hello" });
      assert.deepStrictEqual(transformed, { test: "hello" });
    });

    it("should handle frozen objects by creating a new unfrozen copy", () => {
      const frozen = Object.freeze({ test: "{{ value }}" });
      const transformed = replace(frozen, { value: "hello" });
      assert.deepStrictEqual(transformed, { test: "hello" });
      // Original should still be frozen
      assert.ok(Object.isFrozen(frozen));
      // New object should not be frozen
      assert.ok(!Object.isFrozen(transformed));
    });

    it("should handle sealed objects by creating a new unsealed copy", () => {
      const sealed = Object.seal({ test: "{{ value }}" });
      const transformed = replace(sealed, { value: "hello" });
      assert.deepStrictEqual(transformed, { test: "hello" });
      assert.ok(Object.isSealed(sealed));
      assert.ok(!Object.isSealed(transformed));
    });
  });
});
