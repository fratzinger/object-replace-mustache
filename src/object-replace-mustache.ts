import _get from "lodash/get";
import _has from "lodash/has";
import _set from "lodash/set";
import _isPlainObject from "lodash/isPlainObject";
import _cloneDeep from "lodash/cloneDeep";
import { ObjectReplaceMustacheOptions } from "./types";

const defaultOptions: Required<ObjectReplaceMustacheOptions> = {
  clone: true
}

const replace = <T extends Record<string, any> | any>(
    item: T,
    view: Record<string, any>,
    _options?: Partial<ObjectReplaceMustacheOptions>
): T => {
  const options = Object.assign({}, defaultOptions, _options);

  if (options.clone) {
    item = _cloneDeep(item);
  }

  return recursiveReplace(
    item,
    view
  )
}

const recursiveReplace = <T>(
  item: T, 
  view: Record<string, any>, 
  root?: any,
  path?: string[]
): any => {
  if (!root) { root = item; }
  if (!path) { path = []; }
  if (typeof item === "string") {
    const key = getMustacheKey(item);

    if (key && _has(view, key)) {
      const val = _get(view, key);
      
      if (path.length) {
        _set(root, path, val);
      } else {
        return val;
      }
    }

    return item;
  } else if (_isPlainObject(item)) {
    for (const key in item) {
      recursiveReplace(item[key], view, root, [...path, key]);
    }
    return item;
  } else if (Array.isArray(item)) {
    item.forEach((subItem, i) => recursiveReplace(subItem, view, root, [...path, `${i}`]));
    return item;
  }

  return item;
};

const getMustacheKey = (
  item: string
): string | undefined => {
  if (!item.startsWith("{{") || !item.endsWith("}}")) {
    return;
  }

  if (
    (item.match(/{{/g) || []).length > 1 ||
    (item.match(/}}/g) || []).length > 1
  ) {
    return;
  }

  const keys = item.match(/{{\s*[\w.]+\s*}}/g).map(x => x.match(/[\w.]+/)[0]);

  return keys[0];
};

export default replace;