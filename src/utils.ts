export const isPlainObject = (value: any): value is Record<string, any> =>
  value && [undefined, Object].includes(value.constructor);

function escape(str: string) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); // $& means the whole matched string
}

export const regexForDelimiters = (
  delimiters: [string, string],
  flags?: string,
) => {
  return new RegExp(
    `^${escape(delimiters[0])}(.*?)${escape(delimiters[1])}$`,
    flags,
  );
};
