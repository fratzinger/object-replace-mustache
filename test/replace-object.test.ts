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
        { handleError: "throw" },
      );
      assert.deepStrictEqual(transformed, { test: undefined });
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
});
