export const isPlainObject = (value: any): value is Record<string, any> =>
  value && [undefined, Object].includes(value.constructor);
