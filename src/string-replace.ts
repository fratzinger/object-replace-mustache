// shamelessly taken from https://github.com/vuejs/core/blob/main/packages/compiler-core/src/validateExpression.ts
// these keywords should not appear inside expressions, but operators like
// 'typeof', 'instanceof', and 'in' are allowed
const prohibitedKeywordRE = new RegExp(
  "\\b" +
    (
      "arguments,await,break,case,catch,class,const,continue,debugger,default," +
      "delete,do,else,export,extends,finally,for,function,if,import,let,new," +
      "return,super,switch,throw,try,var,void,while,with,yield"
    )
      .split(",")
      .join("\\b|\\b") +
    "\\b",
);

// strip strings in expressions
const stripStringRE =
  /'(?:[^'\\]|\\.)*'|"(?:[^"\\]|\\.)*"|`(?:[^`\\]|\\.)*\$\{|\}(?:[^`\\]|\\.)*`|`(?:[^`\\]|\\.)*`/g;

export type ReplaceTemplateStringOptions = {
  delimiters?: readonly [string, string];
  /**
   * Whether to throw an error when an error occurs or return the original string
   *
   * @default "throw"
   */
  handleError?: "throw" | "ignore";
};

function escapeRegExp(string: string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); // $& means the whole matched string
}

const defineReplaceTemplateString =
  (options: ReplaceTemplateStringOptions) =>
    (template: string, view = {}) =>
      replaceString(template, view, options);

export const replaceString = (
  template: string,
  view = {},
  options?: ReplaceTemplateStringOptions,
): unknown => {
  const { delimiters = ["${", "}"] } = options ?? {};

  const regex = new RegExp(
    `^${escapeRegExp(delimiters[0])}(.*?)${escapeRegExp(delimiters[1])}$`,
  );

  const expression = regex.exec(template)?.[1];

  if (!expression) {
    return template;
  }

  function silentOrThrow(message: string) {
    if (options?.handleError !== "ignore") {
      throw new Error(message);
    }

    return template;
  }

  // throw with nested expression
  if (expression.match(/\${.*?}/)) {
    throw new Error("nested expression is not allowed in template string");
  }

  const withoutStrings = expression.replace(stripStringRE, "");

  const keywordMatch = withoutStrings.match(prohibitedKeywordRE);

  if (keywordMatch) {
    throw new Error(`${keywordMatch} is not allowed in template string`);
  }

  // check for semicolons
  if (expression.includes(";")) {
    return silentOrThrow("; is not allowed in template string");
  }

  // check for assignment
  if (withoutStrings.includes("=")) {
    if (withoutStrings.match(/<<=|>>=|>>>=/)) {
      return silentOrThrow("assignment is not allowed in template string");
    }

    const strippedCompare = withoutStrings.replace(/!==|===|==|!=|>=|<=/g, "");

    if (strippedCompare.includes("=>")) {
      return silentOrThrow("arrow function is not allowed in template string");
    }

    if (strippedCompare.match(/=/g)) {
      return silentOrThrow("assignment is not allowed in template string");
    }

    // good to go, it's a compare operator
  }

  if (withoutStrings.match(/\+\+|--/g)) {
    throw new Error("assignment is not allowed in template string");
  }

  const accessedVariableNames: string[] = [];

  withoutStrings
    .replace(/!==|===|==|!=|>=|<=|\+|-|\//g, " ")
    .split(/\s+|[()]/)
    .forEach((x) => {
      if (!x) {
        return;
      }
      const match = x.match(/^([a-zA-Z_$][\w$]*)/g)?.[0];
      if (match) {
        accessedVariableNames.push(match);
      }
    });

  const allowedVariables = Object.keys(view);

  const notAllowedVariables = accessedVariableNames.filter(
    (x) => !allowedVariables.includes(x),
  );

  if (notAllowedVariables.length) {
    return silentOrThrow(`${notAllowedVariables.join(", ")} is not defined`);
  }

  return new Function(
    "view",
    /* js */ `
      const tagged = ( ${allowedVariables.join(", ")} ) => ${expression}
      return tagged(...Object.values(view))
    `,
  )(view);
};

export const delimiters = {
  mustache: ["{{", "}}"],
  ejs: ["<%=", "%>"],
} as const;

export const replaceStringMustache = defineReplaceTemplateString({
  delimiters: delimiters.mustache,
});

export const replaceStringEjs = defineReplaceTemplateString({
  delimiters: delimiters.ejs,
});
