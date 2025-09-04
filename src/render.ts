import { replaceString } from "./replace-string";

export type RenderOptions = {
  /**
   * Specify the delimiters
   *
   * @default ['{{', '}}']
   */
  delimiters?: [string, string];
  /**
   * Whether to throw an error when an error occurs or return the original string
   *
   * @default "ignore"
   */
  handleError?: "throw" | "ignore";
  /**
   * Format function to format the value before replacing it in the string.
   */
  format?: (value: any) => string;
};

export const render = (
  str: string,
  view: Record<string, any>,
  options?: RenderOptions,
) =>
  str.replace(
    /\{\{(.*?)\}\}/g,
    (m) => {
      let result = replaceString(m, view, {
        handleError: options?.handleError ?? "ignore",
        delimiters: options?.delimiters,
      }) as string

      if (options?.format) {
        result = options.format(result);
      }

      if (result == null) {
        return "";
      }

      return result;
    }
  );
