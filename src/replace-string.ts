// shamelessly taken from https://github.com/vuejs/core/blob/main/packages/compiler-core/src/validateExpression.ts
// these keywords should not appear inside expressions, but operators like

import { delimitersMustache, regexForDelimiters } from "./utils";
import { parseScript } from "meriyah";

// Simple AST traversal function
function traverseAST(
  node: any,
  visitor: (node: any) => boolean | void
): void {
  if (!node || typeof node !== "object") return;

  // Call visitor, if it returns true, stop traversal
  if (visitor(node) === true) return;

  // Recursively traverse all properties
  for (const key in node) {
    if (key === "type" || key === "loc" || key === "range") continue;
    const value = node[key];

    if (Array.isArray(value)) {
      for (const item of value) {
        traverseAST(item, visitor);
      }
    } else if (value && typeof value === "object") {
      traverseAST(value, visitor);
    }
  }
}

// https://astexplorer.net/

// 'typeof', 'instanceof', and 'in' are allowed
const prohibitedKeywordRE = new RegExp(
  "\\b" +
    (
      "arguments,await,break,case,catch,class,const,continue,debugger,default," +
      "delete,do,else,enum,export,extends,finally,for,function,if,import,let,new," +
      "return,static,super,switch,throw,try,var,void,while,with,yield"
    )
      .split(",")
      .join("\\b|\\b") +
    "\\b",
);

// strip strings in expressions
const stripStringRE =
  /'(?:[^'\\]|\\.)*'|"(?:[^"\\]|\\.)*"|`(?:[^`\\]|\\.)*\$\{|\}(?:[^`\\]|\\.)*`|`(?:[^`\\]|\\.)*`/g;

/**
 * possible values:
 *
 * - "JSON": JSON.stringify
 * - "Object": Object.keys
 * - "Array": Array.isArray
 */
const whitelistNamespaces: string[] = [
  "true",
  "false",
  "null",
  "undefined",
  "typeof",
  "instanceof",
  "in",
  "String",
  "Number",
  "Boolean",
  "Symbol",
  "BigInt",
  "JSON",
  "Object",
  "Array",
  "Math",
  "Date",
  "RegExp",
  "Error",
];

export type ReplaceTemplateStringOptions = {
  /**
   * Specify the delimiters
   *
   * @default ['{{', '}}']
   */
  delimiters?: [string, string];
  /**
   * Whether to throw an error when an error occurs or return the original string
   *
   * @default "throw"
   */
  handleError?: "throw" | "ignore";
};

const defineReplaceTemplateString =
  (options: ReplaceTemplateStringOptions) =>
    (template: string, view = {}) =>
      replaceString(template, view, options);

export const replaceString = (
  template: string,
  view = {},
  options?: ReplaceTemplateStringOptions,
): unknown => {
  const expression = regexForDelimiters(
    options?.delimiters ?? delimitersMustache,
  ).exec(template)?.[1];

  if (!expression) {
    return template;
  }

  function silentOrThrow(err: string | Error) {
    if (options?.handleError !== "ignore") {
      throw typeof err === "string" ? new Error(err) : err;
    }

    return template;
  }

  // throw with nested expression
  if (expression.match(/\${.*?}/)) {
    throw new Error("nested expression is not allowed in template string");
  }

  const withoutStrings = expression.replace(stripStringRE, "");

  const allowedVariables = Object.keys(view);

  const unsafeMethods = ["require", "eval", "console", "this", "window", "document", "global", "process", "module", "exports", "self", "globalThis"].filter(x => allowedVariables.indexOf(x) === -1);

  const keywordMatch = withoutStrings.match(prohibitedKeywordRE);

  if (keywordMatch) {
    throw new Error(`${keywordMatch} is not allowed in template string`);
  }

  let ast;
  try {
    ast = parseScript(expression);
  } catch (err: any) {
    return silentOrThrow(err.message || "Failed to parse expression");
  }

  let unsafe: string | boolean = false;
  traverseAST(ast, (node) => {
    if (unsafe) {
      return true; // Stop traversal
    }

    const type = node.type;

    if (type === "ThisExpression") {
      unsafe = "this is not defined";
      return true;
    }

    if (type === "AssignmentExpression") {
      unsafe = "assignment is not allowed in template string";
      return true;
    }

    if (
      node.type === "VariableDeclaration" ||
      node.type === "FunctionDeclaration"
    ) {
      unsafe = true;
      return true;
    } else if (node.type === "Identifier" && unsafeMethods.indexOf(node.name) != -1) {
      unsafe = `${node.name} is not defined`;
      return true;
    }
  });

  // check for semicolons
  if (expression.includes(";")) {
    return silentOrThrow("; is not allowed in template string");
  }

  // check for assignment
  if (withoutStrings.includes("=")) {
    if (withoutStrings.match(/<<=|>>=|>>>=/)) {
      return silentOrThrow("assignment is not allowed in template string");
    }

    const strippedCompare = withoutStrings.replace(/!==|===|==|!=|>=|<=|=>/g, "");

    if (strippedCompare.match(/=/g)) {
      return silentOrThrow("assignment is not allowed in template string");
    }

    // good to go, it's a compare operator
  }

  if (withoutStrings.match(/\+\+|--/g)) {
    throw new Error("assignment is not allowed in template string");
  }

  if (unsafe) {
    return silentOrThrow(typeof unsafe === "string" ? unsafe : "unsafe operation is not allowed in template string");
  } else {
    try {      
      const result = new Function(
        "view",
        /* js */ `
          const tagged = ( ${allowedVariables.join(", ")} ) => ${expression}
          return tagged(...Object.values(view))
        `,
      )(view);

      if (typeof result === "function") {
        return silentOrThrow("function is not allowed in template string");
      }

      return result;
    } catch (err: any) {
      return silentOrThrow(err);
    }
  }
};

export const delimiters = {
  mustache: ["{{", "}}"],
  ejs: ["<%=", "%>"],
} as const;

export const replaceStringMustache = defineReplaceTemplateString({
  delimiters: delimiters.mustache as any,
});

export const replaceStringEjs = defineReplaceTemplateString({
  delimiters: delimiters.ejs as any,
});
