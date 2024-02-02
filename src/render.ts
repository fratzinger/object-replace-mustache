import { replaceString } from "./replace-string";

export const render = (str: string, view: Record<string, any>) =>
  str.replace(/\{\{(.*?)\}\}/g, (m) => replaceString(m, view) as string);
