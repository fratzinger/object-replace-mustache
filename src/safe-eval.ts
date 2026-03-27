const BLOCKED_PROPERTIES = new Set([
  'constructor',
  '__proto__',
  'prototype',
  '__defineGetter__',
  '__defineSetter__',
  '__lookupGetter__',
  '__lookupSetter__',
])

const BLOCKED_OBJECT_METHODS = new Set([
  'getOwnPropertyDescriptor',
  'getOwnPropertyDescriptors',
  'getPrototypeOf',
  'setPrototypeOf',
  'defineProperty',
  'defineProperties',
  'create',
])

const SafeObject = new Proxy(Object, {
  get(target, prop) {
    if (typeof prop === 'string' && BLOCKED_OBJECT_METHODS.has(prop)) {
      return undefined
    }
    return (target as any)[prop]
  },
})

const ALLOWED_GLOBALS: Record<string, unknown> = {
  Object: SafeObject,
  Array,
  Math,
  String,
  Number,
  Boolean,
  Date,
  JSON,
  Map,
  Set,
  RegExp,
  Error,
  TypeError,
  RangeError,
  parseInt,
  parseFloat,
  isNaN,
  isFinite,
  NaN,
  Infinity,
  undefined,
}

const ALLOWED_CONSTRUCTORS = new Set([
  Date, Array, Map, Set, RegExp, Error, TypeError, RangeError,
  Object, Number, String, Boolean,
])

const MAX_DEPTH = 256
const MAX_CALLS = 10_000
const MAX_STRING_LENGTH = 1_000_000

class ReturnSignal {
  constructor(public value: unknown) {}
}

interface EvalContext {
  depth: number
  calls: number
}

type Scope = Record<string, unknown>

function assertSafeProperty(prop: string | symbol): void {
  if (typeof prop === 'symbol') {
    throw new Error('symbol property access is not allowed')
  }
  if (BLOCKED_PROPERTIES.has(prop)) {
    throw new Error(`access to '${prop}' is not allowed`)
  }
}

function assertStringLength(value: unknown): void {
  if (typeof value === 'string' && value.length > MAX_STRING_LENGTH) {
    throw new Error('string length limit exceeded')
  }
}

function evaluateNode(node: any, scope: Scope, ctx: EvalContext): unknown {
  ctx.depth++
  if (ctx.depth > MAX_DEPTH) {
    throw new Error('expression too complex')
  }

  try {
    return evaluateNodeInner(node, scope, ctx)
  } finally {
    ctx.depth--
  }
}

function evaluateNodeInner(node: any, scope: Scope, ctx: EvalContext): unknown {
  switch (node.type) {
    case 'Program': {
      if (node.body.length !== 1 || node.body[0].type !== 'ExpressionStatement') {
        throw new Error('only single expressions are allowed')
      }
      return evaluateNode(node.body[0], scope, ctx)
    }

    case 'ExpressionStatement':
      return evaluateNode(node.expression, scope, ctx)

    case 'Literal':
      return node.value

    case 'Identifier': {
      const name = node.name
      if (name in scope) {
        return scope[name]
      }
      if (name in ALLOWED_GLOBALS) {
        return ALLOWED_GLOBALS[name]
      }
      throw new Error(`${name} is not defined`)
    }

    case 'MemberExpression': {
      const object = evaluateNode(node.object, scope, ctx)
      let property: string | number

      if (node.computed) {
        property = evaluateNode(node.property, scope, ctx) as string | number
      } else {
        property = (node.property as any).name ?? (node.property as any).value
      }

      assertSafeProperty(property as string)

      if (node.optional && (object == null)) {
        return undefined
      }

      if (object == null) {
        throw new TypeError(
          `Cannot read properties of ${object} (reading '${String(property)}')`,
        )
      }

      return (object as any)[property]
    }

    case 'ChainExpression':
      return evaluateNode(node.expression, scope, ctx)

    case 'CallExpression': {
      const callee = node.callee
      let func: unknown
      let thisArg: unknown

      if (callee.type === 'MemberExpression') {
        thisArg = evaluateNode(callee.object, scope, ctx)

        if (callee.optional && thisArg == null) {
          return undefined
        }

        let prop: string | number
        if (callee.computed) {
          prop = evaluateNode(callee.property, scope, ctx) as string | number
        } else {
          prop = (callee.property as any).name ?? (callee.property as any).value
        }

        assertSafeProperty(prop as string)

        if (thisArg == null) {
          throw new TypeError(
            `Cannot read properties of ${thisArg} (reading '${String(prop)}')`,
          )
        }

        func = (thisArg as any)[prop]
      } else {
        func = evaluateNode(callee, scope, ctx)
        thisArg = undefined
      }

      if (node.optional && func == null) {
        return undefined
      }

      if (typeof func !== 'function') {
        throw new TypeError(`${formatCallee(callee)} is not a function`)
      }

      ctx.calls++
      if (ctx.calls > MAX_CALLS) {
        throw new Error('call limit exceeded')
      }

      const args = evaluateArguments(node.arguments, scope, ctx)
      const result = (func as Function).apply(thisArg, args)
      assertStringLength(result)
      return result
    }

    case 'BinaryExpression': {
      const result = evaluateBinary(
        node.operator,
        evaluateNode(node.left, scope, ctx),
        evaluateNode(node.right, scope, ctx),
      )
      assertStringLength(result)
      return result
    }

    case 'LogicalExpression': {
      const left = evaluateNode(node.left, scope, ctx)
      switch (node.operator) {
        case '&&': return left && evaluateNode(node.right, scope, ctx)
        case '||': return left || evaluateNode(node.right, scope, ctx)
        case '??': return left ?? evaluateNode(node.right, scope, ctx)
        default:
          throw new Error(`unsupported logical operator: ${node.operator}`)
      }
    }

    case 'UnaryExpression': {
      const argument = node.operator === 'typeof' && node.argument.type === 'Identifier' && !(node.argument.name in scope) && !(node.argument.name in ALLOWED_GLOBALS)
        ? undefined
        : evaluateNode(node.argument, scope, ctx)

      switch (node.operator) {
        case '!': return !argument
        case '-': return -(argument as number)
        case '+': return +(argument as number)
        case 'typeof': return typeof argument
        case 'void': return void argument
        case '~': return ~(argument as number)
        default:
          throw new Error(`unsupported unary operator: ${node.operator}`)
      }
    }

    case 'ConditionalExpression':
      return evaluateNode(node.test, scope, ctx)
        ? evaluateNode(node.consequent, scope, ctx)
        : evaluateNode(node.alternate, scope, ctx)

    case 'ArrayExpression':
      return evaluateArrayElements(node.elements, scope, ctx)

    case 'ObjectExpression': {
      const obj: Record<string, unknown> = {}
      for (const prop of node.properties) {
        if (prop.type === 'SpreadElement') {
          Object.assign(obj, evaluateNode(prop.argument, scope, ctx))
        } else {
          const key = prop.computed
            ? evaluateNode(prop.key, scope, ctx) as string
            : (prop.key.name ?? prop.key.value)
          obj[key] = evaluateNode(prop.value, scope, ctx)
        }
      }
      return obj
    }

    case 'ArrowFunctionExpression': {
      return createSafeFunction(node, scope, ctx)
    }

    case 'TemplateLiteral': {
      let result = ''
      for (let i = 0; i < node.quasis.length; i++) {
        result += node.quasis[i].value.cooked
        if (i < node.expressions.length) {
          result += String(evaluateNode(node.expressions[i], scope, ctx))
        }
      }
      assertStringLength(result)
      return result
    }

    case 'SequenceExpression':
      throw new Error('sequence expressions are not allowed')

    case 'AssignmentExpression':
      throw new Error('assignment is not allowed in template string')

    case 'UpdateExpression':
      throw new Error('assignment is not allowed in template string')

    case 'ThisExpression':
      throw new Error('this is not defined')

    case 'NewExpression': {
      const ctor = evaluateNode(node.callee, scope, ctx)
      if (typeof ctor !== 'function' || !ALLOWED_CONSTRUCTORS.has(ctor as any)) {
        throw new Error(`'new ${formatCallee(node.callee)}' is not allowed`)
      }
      const args = evaluateArguments(node.arguments, scope, ctx)
      return new (ctor as any)(...args)
    }

    case 'BlockStatement': {
      const blockScope: Scope = { ...scope }
      for (const stmt of node.body) {
        const result = evaluateNode(stmt, blockScope, ctx)
        if (result instanceof ReturnSignal) {
          return result
        }
      }
      return undefined
    }

    case 'VariableDeclaration': {
      for (const declarator of node.declarations) {
        const name = declarator.id.name
        scope[name] = declarator.init ? evaluateNode(declarator.init, scope, ctx) : undefined
      }
      return undefined
    }

    case 'ReturnStatement':
      return new ReturnSignal(node.argument ? evaluateNode(node.argument, scope, ctx) : undefined)

    case 'IfStatement': {
      const test = evaluateNode(node.test, scope, ctx)
      if (test) {
        const result = evaluateNode(node.consequent, scope, ctx)
        if (result instanceof ReturnSignal) return result
      } else if (node.alternate) {
        const result = evaluateNode(node.alternate, scope, ctx)
        if (result instanceof ReturnSignal) return result
      }
      return undefined
    }

    case 'TaggedTemplateExpression': {
      const tag = evaluateNode(node.tag, scope, ctx) as Function
      const strings = node.quasi.quasis.map((q: any) => q.value.cooked)
      const values = node.quasi.expressions.map((e: any) => evaluateNode(e, scope, ctx))
      return tag(strings, ...values)
    }

    default:
      throw new Error(`unsupported expression type: ${node.type}`)
  }
}

function createSafeFunction(node: any, parentScope: Scope, ctx: EvalContext): Function {
  const paramNames = node.params.map((p: any) => {
    if (p.type === 'Identifier') return p.name
    if (p.type === 'RestElement' && p.argument.type === 'Identifier') return `...${p.argument.name}`
    if (p.type === 'AssignmentPattern' && p.left.type === 'Identifier') return p.left.name
    throw new Error('unsupported parameter type')
  })

  return (...args: unknown[]) => {
    const childScope: Scope = { ...parentScope }

    let argIdx = 0
    for (let i = 0; i < node.params.length; i++) {
      const param = node.params[i]
      if (param.type === 'RestElement') {
        childScope[param.argument.name] = args.slice(argIdx)
      } else if (param.type === 'AssignmentPattern') {
        childScope[param.left.name] = argIdx < args.length ? args[argIdx] : evaluateNode(param.right, childScope, ctx)
        argIdx++
      } else {
        childScope[paramNames[i]] = args[argIdx]
        argIdx++
      }
    }

    ctx.calls++
    if (ctx.calls > MAX_CALLS) {
      throw new Error('call limit exceeded')
    }

    const result = evaluateNode(node.body, childScope, ctx)
    if (result instanceof ReturnSignal) {
      return result.value
    }
    return result
  }
}

function evaluateArguments(args: any[], scope: Scope, ctx: EvalContext): unknown[] {
  const result: unknown[] = []
  for (const arg of args) {
    if (arg.type === 'SpreadElement') {
      const spread = evaluateNode(arg.argument, scope, ctx)
      result.push(...(spread as any[]))
    } else {
      result.push(evaluateNode(arg, scope, ctx))
    }
  }
  return result
}

function evaluateArrayElements(elements: any[], scope: Scope, ctx: EvalContext): unknown[] {
  const result: unknown[] = []
  for (const el of elements) {
    if (el === null) {
      result.push(undefined)
    } else if (el.type === 'SpreadElement') {
      const spread = evaluateNode(el.argument, scope, ctx)
      result.push(...(spread as any[]))
    } else {
      result.push(evaluateNode(el, scope, ctx))
    }
  }
  return result
}

function evaluateBinary(op: string, left: unknown, right: unknown): unknown {
  switch (op) {
    case '+': return (left as any) + (right as any)
    case '-': return (left as any) - (right as any)
    case '*': return (left as any) * (right as any)
    case '/': return (left as any) / (right as any)
    case '%': return (left as any) % (right as any)
    case '**': return (left as any) ** (right as any)
    case '==': return (left as any) == (right as any)
    case '!=': return (left as any) != (right as any)
    case '===': return left === right
    case '!==': return left !== right
    case '<': return (left as any) < (right as any)
    case '>': return (left as any) > (right as any)
    case '<=': return (left as any) <= (right as any)
    case '>=': return (left as any) >= (right as any)
    case '<<': return (left as any) << (right as any)
    case '>>': return (left as any) >> (right as any)
    case '>>>': return (left as any) >>> (right as any)
    case '&': return (left as any) & (right as any)
    case '|': return (left as any) | (right as any)
    case '^': return (left as any) ^ (right as any)
    case 'in': return (left as any) in (right as any)
    case 'instanceof': return (left as any) instanceof (right as any)
    default:
      throw new Error(`unsupported binary operator: ${op}`)
  }
}

function formatCallee(node: any): string {
  if (node.type === 'Identifier') return node.name
  if (node.type === 'MemberExpression') {
    const obj = formatCallee(node.object)
    const prop = node.computed ? `[...]` : `.${node.property.name}`
    return `${obj}${prop}`
  }
  return '<expression>'
}

export function safeEval(ast: any, view: Record<string, unknown>): unknown {
  const scope: Scope = { ...view }
  const ctx: EvalContext = { depth: 0, calls: 0 }
  return evaluateNode(ast, scope, ctx)
}
