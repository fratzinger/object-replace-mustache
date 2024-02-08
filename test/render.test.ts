import { render } from "../src/render";

describe("render.test.ts", () => {
  it("is silent by default", () => {
    expect(render("Hello {{ test }}", {})).toStrictEqual("Hello {{ test }}");
  });

  it("should work with multiple replaces", () => {
    expect(
      render("Hello {{ test }}, here {{ who }} am!", {
        test: "world",
        who: "I",
      }),
    ).toStrictEqual("Hello world, here I am!");
  });

  it("should work number replaces", () => {
    expect(
      render("Hello {{ test }}!", {
        test: 2,
      }),
    ).toStrictEqual("Hello 2!");
  });

  it("should work with expressions", () => {
    expect(
      render("Hello {{ test.length }}, how {{ verb }} {{ you() }}?", {
        test: "test",
        verb: "are",
        you: () => "you",
      }),
    ).toStrictEqual("Hello 4, how are you?");
  });
});
