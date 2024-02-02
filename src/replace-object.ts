import { isPlainObject } from "./utils";
import { replaceString } from "./replace-string";

export interface ObjectReplaceOptions {
  /**
   * The delimiters to use for replacing.
   *
   * @default ["{{", "}}"]
   */
  delimiters?: [string, string];
}

export const replace = <T extends Record<string, any>>(
  item: T,
  view: Record<string, any>,
  options?: ObjectReplaceOptions,
): Record<string, any> => {
  return recursiveReplace(item, view, options);
};

const recursiveReplace = <T>(
  item: T,
  view: Record<string, any>,
  options?: ObjectReplaceOptions,
): any => {
  if (typeof item === "string") {
    return replaceString(item, view, {
      delimiters: options?.delimiters ?? ["{{", "}}"],
      handleError: "ignore",
    });
  } else if (isPlainObject(item)) {
    const result: Record<string, any> = {};
    for (const key in item) {
      result[key] = recursiveReplace(item[key], view);
    }
    return result;
  } else if (Array.isArray(item)) {
    return [...item.map((subItem) => recursiveReplace(subItem, view))];
  }

  return item;
};
