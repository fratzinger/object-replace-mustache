import { replaceStringMustache, replaceString, replaceStringEjs } from "../src";

describe("replace-string.test.ts", () => {
  it("should replace template string that does not start with {{", () => {
    expect(
      replaceString(" {{name}}", {
        name: "world",
      }),
    ).toBe(" {{name}}");
  });

  it("should replace template string that does not end with }", () => {
    expect(
      replaceString("{{name}} ", {
        name: "world",
      }),
    ).toBe("{{name}} ");
  });

  it("should replace template string", () => {
    expect(
      replaceString("{{name}}", {
        name: "world",
      }),
    ).toBe("world");
  });

  it("should replace template string with whitespaces inside", () => {
    expect(
      replaceString("{{ name }}", {
        name: "world",
      }),
    ).toBe("world");
  });

  it("should replace template string with nested context", () => {
    expect(
      replaceString("{{name.world}}", {
        name: {
          world: "hello",
        },
      }),
    ).toBe("hello");
  });

  it("throws with nested expression", () => {
    expect(() => replaceString("{{ 'a' + ${'b'} }}")).toThrowError(
      "nested expression is not allowed in template string",
    );
  });

  describe("access to variables not defined in view", () => {
    it("should not pass current scope", () => {
      const test1 = "test";
      expect(() => replaceString("{{test1}}", {})).toThrowError(
        "test1 is not defined",
      );
    });
  });

  it("should throw with console", () => {
    expect(
      () => replaceString('{{console.log("test")}}', {}),
      "at the beginning",
    ).toThrowError("console is not defined");
    expect(
      () => replaceString("{{1+console.log()}}", {}),
      "after operator",
    ).toThrowError("console is not defined");

    expect(
      () => replaceString("{{1 - console.log()}}", {}),
      "after whitespace",
    ).toThrowError("console is not defined");
  });

  it("should pass with explicit console", () => {
    expect(
      replaceString('{{console.log("test")}}', { console }),
    ).toBeUndefined();
  });

  it("should throw with 'this'", () => {
    expect(() => replaceString("{{this}}", {})).toThrowError(
      "this is not defined",
    );
  });

  describe("expressions containing '=' / assignment", () => {
    it("should throw with assignment", () => {
      const unallowed = [
        "+=",
        "-=",
        "*=",
        "/=",
        "%=",
        "**=",
        "<<=",
        ">>=",
        "&=",
        "^=",
        "|=",
        "&&=",
        "||=",
        "??=",
      ];

      expect(() => replaceString("{{a=2*2}}", { a: 3 })).toThrowError(
        "assignment is not allowed in template string",
      );

      unallowed.forEach((x) => {
        expect(
          () => replaceString("{{a" + x + "2}}", { a: 3 }),
          x,
        ).toThrowError("assignment is not allowed in template string");
      });
    });

    it("should throw with '++' and '--'", () => {
      expect(() => replaceString("{{a++}}", { a: 3 })).toThrowError(
        "assignment is not allowed in template string",
      );
      expect(() => replaceString("{{a--}}", { a: 3 })).toThrowError(
        "assignment is not allowed in template string",
      );
    });

    it("should pass with compare operator", () => {
      const allowed = ["==", "!=", "===", "!==", ">", "<", ">=", "<="];

      allowed.forEach((x) => {
        expect(replaceString("{{a" + x + "2}}", { a: 3 })).toBeTypeOf(
          "boolean",
        );
      });
    });

    it("function", () => {
      expect(() => replaceString("{{() => true}}", { a: 3 })).toBeTypeOf("function");
    });
  });

  it("should work with expressions", () => {
    expect(
      replaceString("{{name.toUpperCase()}}", {
        name: "world",
      }),
    ).toBe("WORLD");
  });

  it("should replace number", () => {
    expect(
      replaceString("{{name}}", {
        name: 2,
      }),
    ).toBe(2);
  });

  it("should replace comparison", () => {
    expect(
      replaceString("{{2>1}}", {
        name: 2,
      }),
    ).toBe(true);
  });

  it("should replace comparison object", () => {
    expect(
      replaceString("{{ nested.object === true }}", {
        nested: { object: true },
      }),
    ).toBe(true);

    expect(
      replaceString("{{ nested.object === false }}", {
        nested: { object: false },
      }),
    ).toBe(true);

    expect(
      replaceString("{{ nested.object !== false }}", {
        nested: { object: true },
      }),
    ).toBe(true);

    expect(
      replaceString("{{ nested.object === null }}", {
        nested: { object: null },
      }),
    ).toBe(true);

    expect(
      replaceString("{{ !nested?.deep?.object }}", {
        nested: { deep: undefined },
      }),
    ).toBe(true);

    expect(
      replaceString("{{ nested?.deep?.object === undefined }}", {
        nested: { deep: undefined },
      }),
    ).toBe(true);
  });

  it("should work with typeof", () => {
    expect(
      replaceString("{{typeof name}}", {
        name: "world",
      }),
    ).toBe("string");
  });

  it("should work with instanceof", () => {
    expect(
      replaceString("{{name instanceof String}}", {
        name: "world",
      }),
    ).toBe(false);
  });

  it("should work with in", () => {
    expect(
      replaceString("{{'name' in obj}}", {
        obj: { name: "test" },
      }),
    ).toBe(true);
  });

  it("should work with 'Object'", () => {
    expect(
      replaceString("{{Object.keys(a)}}", { a: { test: 1, test1: 2 } }),
    ).toStrictEqual(["test", "test1"]);
  });

  it("replaced object should be the exact same object", () => {
    const obj = { a: 1 };
    expect(replaceString("{{obj}}", { obj })).toBe(obj);
  });

  it("Object.keys", () => {
    expect(replaceString("{{Object.keys(a)}}", { a: { test: 1 } })).toStrictEqual(["test"]);
  });

  it("Array.reduce", () => {
    expect(replaceString("{{a.reduce((a,b) => a+b, 0)}}", { a: [1, 2, 3] })).toBe(6);

    expect(replaceString("{{ data?.material?.reduce((acc, item) => acc + (item.amount ?? 0), 0) ?? 0 }}", {data: {} })).toBe(0);
    expect(replaceString("{{ data?.material?.reduce((acc, item) => acc + (item.amount ?? 0), 0) ?? 0 }}", { data: { material: [{ amount: 1 }, { amount: 2 }] } })).toBe(3);
  });

  it("Array.map", () => {
    expect(replaceString("{{a.map(x => x*2)}}", { a: [1, 2, 3] })).toStrictEqual([2, 4, 6]);
  });

  it("Array.filter", () => {
    expect(replaceString("{{a.filter(x => x>1)}}", { a: [1, 2, 3] })).toStrictEqual([2, 3]);
  });

  describe("reserved keywords", () => {
    it("should throw with 'arguments'", () => {
      expect(() => replaceString("{{arguments}}", {})).toThrowError(
        "arguments is not allowed in template string",
      );
    });

    it("should throw with prohibited keywords", () => {
      expect(
        () =>
          replaceString("{{await name}}", {
            name: "world",
          }),
        "without operator",
      ).toThrowError("await is not allowed in template string");

      expect(
        () =>
          replaceString("{{2+await name}}", {
            name: "world",
          }),
        "with operator",
      ).toThrowError("await is not allowed in template string");
    });
  });

  describe("error handling", () => {
    it("should throw cannot read properties of undefined", () => {
      expect(() =>
        replaceString(
          "{{ nested.object === true }}",
          { nested: undefined },
          { handleError: "throw" },
        ),
      ).toThrowError("Cannot read properties of undefined (reading 'object')");
    });

    it("should ignore cannot read properties of undefined", () => {
      expect(
        replaceString(
          "{{ nested.object === true }}",
          { nested: undefined },
          { handleError: "ignore" },
        ),
      ).toBe("{{ nested.object === true }}");

      expect(() =>
        replaceString(
          "{{ nested.object === true }}",
          { nested: undefined },
          { handleError: "throw" },
        ),
      ).toThrowError();
    });
  });

  describe("mustache", () => {
    it("should work with mustache", () => {
      expect(replaceStringMustache("{{name}}", { name: "world" })).toBe(
        "world",
      );
    });

    it("does not change string", function () {
      const transformed = replaceStringMustache("test", { test: false });
      assert.deepStrictEqual(transformed, "test", "string hasn't changed");
    });

    it("changes string with boolean", function () {
      const transformed = replaceStringMustache("{{ test }}", { test: true });
      assert.deepStrictEqual(transformed, true, "item changed");
    });

    it("changes string with number", function () {
      const transformed = replaceStringMustache("{{ test }}", { test: 1 });
      assert.deepStrictEqual(transformed, 1, "item changed");
    });

    it("changes string with string", function () {
      const transformed = replaceStringMustache("{{ test }}", { test: "no" });
      assert.deepStrictEqual(transformed, "no", "item changed");
    });

    it("changes string with object", function () {
      const transformed = replaceStringMustache("{{ test }}", {
        test: { hello: "world" },
      });
      assert.deepStrictEqual(transformed, { hello: "world" }, "item changed");
    });

    it("changes string with nested object path", function () {
      const transformed = replaceStringMustache("{{ test.hello }}", {
        test: { hello: "world" },
      });
      assert.deepStrictEqual(transformed, "world", "item changed");
    });

    it("changes string with array", function () {
      const transformed = replaceStringMustache("{{ test }}", {
        test: [1, 2, 3],
      });
      assert.deepStrictEqual(transformed, [1, 2, 3], "item changed");
    });

    it("changes string with array item", function () {
      const transformed = replaceStringMustache("{{ test[1] }}", {
        test: [1, 2, 3],
      });
      assert.deepStrictEqual(transformed, 2, "item changed");
    });
  });

  describe("ejs", () => {
    it("should work with ejs", () => {
      expect(replaceStringEjs("<%= name %>", { name: "world" })).toBe("world");
    });
  });
});
