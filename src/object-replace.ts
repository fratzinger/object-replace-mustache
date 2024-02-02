import _set from "lodash/set.js";
import _isPlainObject from "lodash/isPlainObject.js";
import copy from "fast-copy";
import { replaceString } from "./string-replace";

export interface ObjectReplaceOptions {
  /**
   * If true, the original object will be cloned before replacing.
   *
   * @default true
   */
  clone?: boolean;

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
  _options?: ObjectReplaceOptions,
): Record<string, any> => {
  if (_options?.clone ?? true) {
    item = copy(item);
  }

  return recursiveReplace(item, view);
};

const recursiveReplace = <T>(
  item: T,
  view: Record<string, any>,
  root?: any,
  path?: string[],
): any => {
  if (!root) {
    root = item;
  }
  if (!path) {
    path = [];
  }
  if (typeof item === "string") {
    const val = replaceString(item, view, {
      delimiters: ["{{", "}}"],
      handleError: "ignore",
    });

    if (path.length) {
      _set(root, path, val);
    } else {
      return val;
    }

    return item;
  } else if (_isPlainObject(item)) {
    for (const key in item) {
      recursiveReplace(item[key], view, root, [...path, key]);
    }
    return item;
  } else if (Array.isArray(item)) {
    item.forEach((subItem, i) =>
      recursiveReplace(subItem, view, root, [...(path ?? []), `${i}`]),
    );
    return item;
  }

  return item;
};
