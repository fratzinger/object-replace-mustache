export const isPlainObject = (value: any): value is Record<string, any> =>
  !!value && [undefined, Object].includes(value.constructor)

function escape(str: string) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') // $& means the whole matched string
}

export const delimitersMustache: [string, string] = ['{{', '}}']

export const regexForDelimiters = (
  delimiters: [string, string],
  flags?: string,
  anchored = true,
) => {
  const pattern = `${escape(delimiters[0])}(.*?)${escape(delimiters[1])}`
  return new RegExp(
    anchored ? `^${pattern}$` : pattern,
    flags,
  )
}
