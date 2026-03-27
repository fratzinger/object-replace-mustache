import { delimitersMustache, regexForDelimiters } from './utils'
import { parseScript } from 'meriyah'
import { safeEval } from './safe-eval'

export type ReplaceTemplateStringOptions = {
  /**
   * Specify the delimiters
   *
   * @default ['{{', '}}']
   */
  delimiters?: [string, string]
  /**
   * Whether to throw an error when an error occurs or return the original string
   *
   * @default "throw"
   */
  handleError?: 'throw' | 'ignore'
}

const defineReplaceTemplateString =
  (options: ReplaceTemplateStringOptions) =>
  (template: string, view = {}) =>
    replaceString(template, view, options)

export const replaceString = (
  template: string,
  view = {},
  options?: ReplaceTemplateStringOptions,
): unknown => {
  const expression = regexForDelimiters(
    options?.delimiters ?? delimitersMustache,
  ).exec(template)?.[1]

  if (!expression) {
    return template
  }

  function silentOrThrow(err: string | Error) {
    if (options?.handleError !== 'ignore') {
      throw typeof err === 'string' ? new Error(err) : err
    }

    return template
  }

  // Check for invalid nested expressions (${} outside of template literals)
  const hasInvalidNestedExpr = expression.match(/\${/)
  if (hasInvalidNestedExpr) {
    let isValid = true
    let inTemplate = false
    let escaped = false

    for (let i = 0; i < expression.length; i++) {
      const char = expression[i]
      const next = expression[i + 1]

      if (escaped) {
        escaped = false
        continue
      }

      if (char === '\\') {
        escaped = true
        continue
      }

      if (char === '`') {
        inTemplate = !inTemplate
      }

      if (char === '$' && next === '{' && !inTemplate) {
        isValid = false
        break
      }
    }

    if (!isValid) {
      throw new Error('nested expression is not allowed in template string')
    }
  }

  let ast
  try {
    ast = parseScript(expression)
  } catch (err: any) {
    return silentOrThrow(err.message || 'Failed to parse expression')
  }

  try {
    return safeEval(ast, view)
  } catch (err: any) {
    return silentOrThrow(err)
  }
}

export const delimiters = {
  mustache: ['{{', '}}'],
  ejs: ['<%=', '%>'],
} as const

export const replaceStringMustache = defineReplaceTemplateString({
  delimiters: delimiters.mustache as any,
})

export const replaceStringEjs = defineReplaceTemplateString({
  delimiters: delimiters.ejs as any,
})
