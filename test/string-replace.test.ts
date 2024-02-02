import { replaceStringMustache, replaceString, replaceStringEjs } from "../src";

it("should replace template string that does not start with ${", () => {
  expect(
    replaceString(" ${name}", {
      name: "world",
    }),
  ).toBe(" ${name}");
});

it("should replace template string that does not end with }", () => {
  expect(
    replaceString("${name} ", {
      name: "world",
    }),
  ).toBe("${name} ");
});

it("should replace template string", () => {
  expect(
    replaceString("${name}", {
      name: "world",
    }),
  ).toBe("world");
});

it("should replace template string with whitespaces inside", () => {
  expect(
    replaceString("${ name }", {
      name: "world",
    }),
  ).toBe("world");
});

it("should replace template string with nested context", () => {
  expect(
    replaceString("${name.world}", {
      name: {
        world: "hello",
      },
    }),
  ).toBe("hello");
});

it("throws with nested expression", () => {
  expect(() => replaceString("${ 'a' + ${'b'} }")).toThrowError(
    "nested expression is not allowed in template string",
  );
});

describe("access to variables not defined in view", () => {
  it("should not pass current scope", () => {
    const test1 = "test";
    expect(() => replaceString("${test1}", {})).toThrowError(
      "test1 is not defined",
    );
  });
});

it("should throw with console", () => {
  expect(
    () => replaceString('${console.log("test")}', {}),
    "at the beginning",
  ).toThrowError("console is not defined");
  expect(
    () => replaceString("${1+console.log()}", {}),
    "after operator",
  ).toThrowError("console is not defined");

  expect(
    () => replaceString("${1 - console.log()}", {}),
    "after whitespace",
  ).toThrowError("console is not defined");
});

it("should pass with explicit console", () => {
  expect(replaceString('${console.log("test")}', { console })).toBeUndefined();
});

it("should throw with 'this'", () => {
  expect(() => replaceString("${this}", {})).toThrowError(
    "this is not defined",
  );
});

it("should throw with 'Object'", () => {
  expect(() =>
    replaceString("${Object.keys(a)}", { a: { test: 1, test1: 2 } }),
  ).toThrowError("Object is not defined");
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

    expect(() => replaceString("${a=2*2}", { a: 3 })).toThrowError(
      "assignment is not allowed in template string",
    );

    unallowed.forEach((x) => {
      expect(() => replaceString("${a" + x + "2}", { a: 3 }), x).toThrowError(
        "assignment is not allowed in template string",
      );
    });
  });

  it("should throw with '++' and '--'", () => {
    expect(() => replaceString("${a++}", { a: 3 })).toThrowError(
      "assignment is not allowed in template string",
    );
    expect(() => replaceString("${a--}", { a: 3 })).toThrowError(
      "assignment is not allowed in template string",
    );
  });

  it("should pass with compare operator", () => {
    const allowed = ["==", "!=", "===", "!==", ">", "<", ">=", "<="];

    allowed.forEach((x) => {
      expect(replaceString("${a" + x + "2}", { a: 3 })).toBeTypeOf("boolean");
    });
  });

  it("should throw with arrow function", () => {
    expect(() => replaceString("${() => true}", { a: 3 })).toThrowError(
      "arrow function is not allowed in template string",
    );
  });
});

it("should work with expressions", () => {
  expect(
    replaceString("${name.toUpperCase()}", {
      name: "world",
    }),
  ).toBe("WORLD");
});

it("should replace number", () => {
  expect(
    replaceString("${name}", {
      name: 2,
    }),
  ).toBe(2);
});

it("replaced object should be the exact same object", () => {
  const obj = { a: 1 };
  expect(replaceString("${obj}", { obj })).toBe(obj);
});

describe("reserved keywords", () => {
  it("should throw with 'arguments'", () => {
    expect(() => replaceString("${arguments}", {})).toThrowError(
      "arguments is not allowed in template string",
    );
  });

  it("should throw with prohibited keywords", () => {
    expect(
      () =>
        replaceString("${await name}", {
          name: "world",
        }),
      "without operator",
    ).toThrowError("await is not allowed in template string");

    expect(
      () =>
        replaceString("${2+await name}", {
          name: "world",
        }),
      "with operator",
    ).toThrowError("await is not allowed in template string");
  });
});

describe("mustache", () => {
  it("should work with mustache", () => {
    expect(replaceStringMustache("{{name}}", { name: "world" })).toBe("world");
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
