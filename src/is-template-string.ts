import { delimitersMustache, regexForDelimiters } from "./utils";

export type IsTemplateStringOptions = {
  delimiters: [string, string];
}

export const isTemplateString = (str: any, options?: IsTemplateStringOptions): str is string => {
  if (!str || (typeof str !== "string")) {
    return false;
  }

  const regex = regexForDelimiters(options?.delimiters ?? delimitersMustache);

  return regex.test(str);
}