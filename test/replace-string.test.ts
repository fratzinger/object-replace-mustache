import { replaceStringMustache, replaceString, replaceStringEjs } from '../src'

describe('replace-string.test.ts', () => {
  it('simple values', () => {
    expect(replaceString('{{true}}', {})).toBe(true)
    expect(replaceString('{{false}}', {})).toBe(false)
    expect(replaceString('{{null}}', {})).toBe(null)
    expect(replaceString('{{undefined}}', {})).toBe(undefined)
    expect(replaceString("{{'test'}}", {})).toBe('test')
    expect(replaceString('{{1}}', {})).toBe(1)
    expect(replaceString('{{0}}', {})).toBe(0)
  })

  it('should replace template string that does not start with {{', () => {
    expect(
      replaceString(' {{name}}', {
        name: 'world',
      }),
    ).toBe(' {{name}}')
  })

  it('should replace template string that does not end with }', () => {
    expect(
      replaceString('{{name}} ', {
        name: 'world',
      }),
    ).toBe('{{name}} ')
  })

  it('should replace template string', () => {
    expect(
      replaceString('{{name}}', {
        name: 'world',
      }),
    ).toBe('world')
  })

  it('should replace template string with whitespaces inside', () => {
    expect(
      replaceString('{{ name }}', {
        name: 'world',
      }),
    ).toBe('world')
  })

  it('should replace template string with nested context', () => {
    expect(
      replaceString('{{name.world}}', {
        name: {
          world: 'hello',
        },
      }),
    ).toBe('hello')
  })

  it('throws with nested expression', () => {
    expect(() => replaceString("{{ 'a' + ${'b'} }}")).toThrowError(
      'nested expression is not allowed in template string',
    )
  })

  describe('access to variables not defined in view', () => {
    it('should not pass current scope', () => {
      // eslint-disable-next-line unused-imports/no-unused-vars
      const test1 = 'test'
      expect(() => replaceString('{{test1}}', {})).toThrowError(
        'test1 is not defined',
      )
    })
  })

  it('should throw with console', () => {
    expect(
      () => replaceString('{{console.log("test")}}', {}),
      'at the beginning',
    ).toThrowError('console is not defined')
    expect(
      () => replaceString('{{1+console.log()}}', {}),
      'after operator',
    ).toThrowError('console is not defined')

    expect(
      () => replaceString('{{1 - console.log()}}', {}),
      'after whitespace',
    ).toThrowError('console is not defined')
  })

  it('should pass with explicit console', () => {
    expect(
      replaceString('{{console.log("test")}}', { console }),
    ).toBeUndefined()
  })

  it("should throw with 'this'", () => {
    expect(() => replaceString('{{this}}', {})).toThrowError(
      'this is not defined',
    )
  })

  describe("expressions containing '=' / assignment", () => {
    it('should throw with assignment', () => {
      const unallowed = [
        '+=',
        '-=',
        '*=',
        '/=',
        '%=',
        '**=',
        '<<=',
        '>>=',
        '&=',
        '^=',
        '|=',
        '&&=',
        '||=',
        '??=',
      ]

      expect(() => replaceString('{{a=2*2}}', { a: 3 })).toThrowError(
        'assignment is not allowed in template string',
      )

      unallowed.forEach((x) => {
        expect(
          () => replaceString('{{a' + x + '2}}', { a: 3 }),
          x,
        ).toThrowError('assignment is not allowed in template string')
      })
    })

    it("should throw with '++' and '--'", () => {
      expect(() => replaceString('{{a++}}', { a: 3 })).toThrowError(
        'assignment is not allowed in template string',
      )
      expect(() => replaceString('{{a--}}', { a: 3 })).toThrowError(
        'assignment is not allowed in template string',
      )
    })

    it('should pass with compare operator', () => {
      const allowed = ['==', '!=', '===', '!==', '>', '<', '>=', '<=']

      allowed.forEach((x) => {
        expect(replaceString('{{a' + x + '2}}', { a: 3 })).toBeTypeOf('boolean')
      })
    })

    it('arrow function returns callable', () => {
      const fn = replaceString('{{() => true}}', { a: 3 }) as (
        ...args: any[]
      ) => unknown
      expect(typeof fn).toBe('function')
      expect(fn()).toBe(true)
    })

    it('compare two variables', () => {
      expect(replaceString('{{a !== b}}', { a: 3, b: '3' })).toBe(true)
      expect(replaceString('{{a === b}}', { a: 3, b: 3 })).toBe(true)
    })

    it('compares two nested variables', () => {
      expect(
        replaceString('{{a.value !== b.value}}', {
          a: { value: 3 },
          b: { value: '3' },
        }),
      ).toBe(true)

      expect(
        replaceString('{{a.value === b.value}}', {
          a: { value: 3 },
          b: { value: 3 },
        }),
      ).toBe(true)
    })

    it('compares two nested variables with fallback', () => {
      expect(
        replaceString('{{a.value === (b.value ?? 3)}}', {
          a: { value: 3 },
          b: {},
        }),
      ).toBe(true)
    })
  })

  it('should work with expressions', () => {
    expect(
      replaceString('{{name.toUpperCase()}}', {
        name: 'world',
      }),
    ).toBe('WORLD')
  })

  it('should replace number', () => {
    expect(
      replaceString('{{name}}', {
        name: 2,
      }),
    ).toBe(2)
  })

  it('should replace comparison', () => {
    expect(
      replaceString('{{2>1}}', {
        name: 2,
      }),
    ).toBe(true)
  })

  it('should replace comparison object', () => {
    expect(
      replaceString('{{ nested.object === true }}', {
        nested: { object: true },
      }),
    ).toBe(true)

    expect(
      replaceString('{{ nested.object === false }}', {
        nested: { object: false },
      }),
    ).toBe(true)

    expect(
      replaceString('{{ nested.object !== false }}', {
        nested: { object: true },
      }),
    ).toBe(true)

    expect(
      replaceString('{{ nested.object === null }}', {
        nested: { object: null },
      }),
    ).toBe(true)

    expect(
      replaceString('{{ !nested?.deep?.object }}', {
        nested: { deep: undefined },
      }),
    ).toBe(true)

    expect(
      replaceString('{{ nested?.deep?.object === undefined }}', {
        nested: { deep: undefined },
      }),
    ).toBe(true)
  })

  it('should work with optional chaining', () => {
    expect(
      replaceString('{{ nested?.deep?.object }}', {
        nested: { deep: { object: 'value' } },
      }),
    ).toBe('value')

    expect(
      replaceString('{{ nested?.deep?.object }}', {
        nested: { deep: undefined },
      }),
    ).toBeUndefined()
  })

  it('should work with typeof', () => {
    expect(
      replaceString('{{typeof name}}', {
        name: 'world',
      }),
    ).toBe('string')
  })

  it('should work with instanceof', () => {
    expect(
      replaceString('{{name instanceof String}}', {
        name: 'world',
      }),
    ).toBe(false)
  })

  it('should work with in', () => {
    expect(
      replaceString("{{'name' in obj}}", {
        obj: { name: 'test' },
      }),
    ).toBe(true)
  })

  it("should work with 'Object'", () => {
    expect(
      replaceString('{{Object.keys(a)}}', { a: { test: 1, test1: 2 } }),
    ).toStrictEqual(['test', 'test1'])
  })

  it('replaced object should be the exact same object', () => {
    const obj = { a: 1 }
    expect(replaceString('{{obj}}', { obj })).toBe(obj)
  })

  it('Object.keys', () => {
    expect(
      replaceString('{{Object.keys(a)}}', { a: { test: 1 } }),
    ).toStrictEqual(['test'])
  })

  it('Array.reduce', () => {
    expect(
      replaceString('{{a.reduce((a,b) => a+b, 0)}}', { a: [1, 2, 3] }),
    ).toBe(6)

    expect(
      replaceString(
        '{{ data?.material?.reduce((acc, item) => acc + (item.amount ?? 0), 0) ?? 0 }}',
        { data: {} },
      ),
    ).toBe(0)
    expect(
      replaceString(
        '{{ data?.material?.reduce((acc, item) => acc + (item.amount ?? 0), 0) ?? 0 }}',
        { data: { material: [{ amount: 1 }, { amount: 2 }] } },
      ),
    ).toBe(3)
  })

  it('Array.map', () => {
    expect(
      replaceString('{{a.map(x => x*2)}}', { a: [1, 2, 3] }),
    ).toStrictEqual([2, 4, 6])
  })

  it('Array.filter', () => {
    expect(
      replaceString('{{a.filter(x => x>1)}}', { a: [1, 2, 3] }),
    ).toStrictEqual([2, 3])
  })

  it("negation '!'", () => {
    expect(replaceString('{{!isActive}}', { isActive: false })).toBe(true)
    expect(replaceString('{{!isActive}}', { isActive: true })).toBe(false)
  })

  it("double negation '!!'", () => {
    expect(replaceString('{{!!value}}', { value: 'test' })).toBe(true)
    expect(replaceString('{{!!value}}', { value: '' })).toBe(false)
  })

  it('_.numberFormat', () => {
    const context = {
      data: {},
      _: {
        numberFormat: (value = 0, options = {}) =>
          new Intl.NumberFormat('de-DE', options).format(value),
      },
    }
    const template =
      "{{ _.numberFormat(data?.material?.reduce((acc, item) => acc + (item.amount ?? 0), 0) ?? 0, { style: 'currency', currency: 'EUR' }) }}"

    // https://stackoverflow.com/questions/2132348/what-does-char-160-mean-in-my-source-code
    expect(replaceString(template, context)).toStrictEqual(
      `0,00${String.fromCharCode(160)}€`,
    )
  })

  describe('reserved keywords', () => {
    it("should throw with 'arguments'", () => {
      expect(() => replaceString('{{arguments}}', {})).toThrowError(
        'arguments is not defined',
      )
    })

    it('should throw with prohibited keywords', () => {
      expect(
        () =>
          replaceString('{{await name}}', {
            name: 'world',
          }),
        'without operator',
      ).toThrowError()

      expect(
        () =>
          replaceString('{{2+await name}}', {
            name: 'world',
          }),
        'with operator',
      ).toThrowError()
    })
  })

  describe('error handling', () => {
    it('should throw cannot read properties of undefined', () => {
      expect(() =>
        replaceString(
          '{{ nested.object === true }}',
          { nested: undefined },
          { handleError: 'throw' },
        ),
      ).toThrowError("Cannot read properties of undefined (reading 'object')")
    })

    it('should ignore cannot read properties of undefined', () => {
      expect(
        replaceString(
          '{{ nested.object === true }}',
          { nested: undefined },
          { handleError: 'ignore' },
        ),
      ).toBe('{{ nested.object === true }}')

      expect(() =>
        replaceString(
          '{{ nested.object === true }}',
          { nested: undefined },
          { handleError: 'throw' },
        ),
      ).toThrowError()
    })
  })

  describe('mustache', () => {
    it('should work with mustache', () => {
      expect(replaceStringMustache('{{name}}', { name: 'world' })).toBe('world')
    })

    it('does not change string', function () {
      const transformed = replaceStringMustache('test', { test: false })
      assert.deepStrictEqual(transformed, 'test', "string hasn't changed")
    })

    it('changes string with boolean', function () {
      const transformed = replaceStringMustache('{{ test }}', { test: true })
      assert.deepStrictEqual(transformed, true, 'item changed')
    })

    it('changes string with number', function () {
      const transformed = replaceStringMustache('{{ test }}', { test: 1 })
      assert.deepStrictEqual(transformed, 1, 'item changed')
    })

    it('changes string with string', function () {
      const transformed = replaceStringMustache('{{ test }}', { test: 'no' })
      assert.deepStrictEqual(transformed, 'no', 'item changed')
    })

    it('changes string with object', function () {
      const transformed = replaceStringMustache('{{ test }}', {
        test: { hello: 'world' },
      })
      assert.deepStrictEqual(transformed, { hello: 'world' }, 'item changed')
    })

    it('changes string with nested object path', function () {
      const transformed = replaceStringMustache('{{ test.hello }}', {
        test: { hello: 'world' },
      })
      assert.deepStrictEqual(transformed, 'world', 'item changed')
    })

    it('changes string with array', function () {
      const transformed = replaceStringMustache('{{ test }}', {
        test: [1, 2, 3],
      })
      assert.deepStrictEqual(transformed, [1, 2, 3], 'item changed')
    })

    it('changes string with array item', function () {
      const transformed = replaceStringMustache('{{ test[1] }}', {
        test: [1, 2, 3],
      })
      assert.deepStrictEqual(transformed, 2, 'item changed')
    })
  })

  describe('ejs', () => {
    it('should work with ejs', () => {
      expect(replaceStringEjs('<%= name %>', { name: 'world' })).toBe('world')
    })
  })

  describe('security - blocked globals', () => {
    it("should block 'window' access", () => {
      expect(() => replaceString('{{window}}', {})).toThrowError(
        'window is not defined',
      )
    })

    it("should block 'document' access", () => {
      expect(() => replaceString('{{document}}', {})).toThrowError(
        'document is not defined',
      )
    })

    it("should block 'global' access", () => {
      expect(() => replaceString('{{global}}', {})).toThrowError(
        'global is not defined',
      )
    })

    it("should block 'process' access", () => {
      expect(() => replaceString('{{process}}', {})).toThrowError(
        'process is not defined',
      )
    })

    it("should block 'require' access", () => {
      expect(() => replaceString('{{require}}', {})).toThrowError(
        'require is not defined',
      )
    })

    it("should block 'module' access", () => {
      expect(() => replaceString('{{module}}', {})).toThrowError(
        'module is not defined',
      )
    })

    it("should block 'exports' access", () => {
      expect(() => replaceString('{{exports}}', {})).toThrowError(
        'exports is not defined',
      )
    })

    it("should block 'self' access", () => {
      expect(() => replaceString('{{self}}', {})).toThrowError(
        'self is not defined',
      )
    })

    it("should block 'globalThis' access", () => {
      expect(() => replaceString('{{globalThis}}', {})).toThrowError(
        'globalThis is not defined',
      )
    })

    it("should block 'eval' access", () => {
      expect(() => replaceString('{{eval}}', {})).toThrowError(
        'eval is not defined',
      )
    })

    it("should block 'Function' constructor access", () => {
      expect(() => replaceString('{{Function}}', {})).toThrowError(
        'Function is not defined',
      )
    })

    it('should block property access on blocked globals', () => {
      expect(() => replaceString('{{process.env}}', {})).toThrowError()
      expect(() => replaceString('{{window.location}}', {})).toThrowError()
    })
  })

  describe('security - AST-based blocking', () => {
    it('should block variable declarations', () => {
      expect(() => replaceString('{{var x = 1}}', {})).toThrowError()
    })

    it('should block let declarations', () => {
      expect(() => replaceString('{{let x = 1}}', {})).toThrowError()
    })

    it('should block const declarations', () => {
      expect(() => replaceString('{{const x = 1}}', {})).toThrowError()
    })

    it('should block function declarations', () => {
      expect(() => replaceString('{{function foo() {}}}', {})).toThrowError()
    })

    it('should allow arrow functions in expressions', () => {
      expect(replaceString('{{[1,2,3].map(x => x * 2)}}', {})).toStrictEqual([
        2, 4, 6,
      ])
    })
  })

  describe('expression edge cases', () => {
    it('should handle bitwise left shift', () => {
      expect(replaceString('{{a << 2}}', { a: 1 })).toBe(4)
    })

    it('should handle bitwise right shift', () => {
      expect(replaceString('{{a >> 1}}', { a: 8 })).toBe(4)
    })

    it('should handle unsigned right shift', () => {
      expect(replaceString('{{a >>> 1}}', { a: 8 })).toBe(4)
    })

    it('should handle multiple consecutive operations', () => {
      expect(
        replaceString('{{a + b - c * d / e}}', {
          a: 10,
          b: 5,
          c: 2,
          d: 3,
          e: 2,
        }),
      ).toBe(12)
    })

    it('should handle nested ternary operators', () => {
      expect(
        replaceString("{{a ? b ? 'yes' : 'maybe' : 'no'}}", {
          a: true,
          b: false,
        }),
      ).toBe('maybe')
    })

    it('should handle complex optional chaining', () => {
      expect(
        replaceString('{{a?.b?.c?.d?.e}}', {
          a: { b: { c: { d: { e: 'deep' } } } },
        }),
      ).toBe('deep')
    })

    it('should handle spread operator in arrays', () => {
      expect(replaceString('{{[...arr]}}', { arr: [1, 2, 3] })).toStrictEqual([
        1, 2, 3,
      ])
    })

    it('should handle spread with multiple arrays', () => {
      expect(
        replaceString('{{[...a, ...b]}}', { a: [1, 2], b: [3, 4] }),
      ).toStrictEqual([1, 2, 3, 4])
    })

    it('should handle concatentation of strings and variables', () => {
      expect(
        replaceString("{{'Hello, ' + name + '!'}}", { name: 'Alice' }),
      ).toBe('Hello, Alice!')
    })

    it('should handle concatentation of strings and variables with fallback', () => {
      expect(
        replaceString(
          "{{ (_.get(data, scope)?.amount ?? '') + ' ' + (_.get(data, scope)?.unit ?? '') }}",
          {
            _: {
              get: (obj: any, path: string) => {
                const keys = path.split('.')
                let result = obj
                for (const key of keys) {
                  result = result?.[key]
                }
                return result
              },
            },
            data: { ctx: { amount: 5, unit: 'kg' } },
            scope: 'ctx',
          },
        ),
      ).toBe('5 kg')
    })

    it('should handle template strings within expressions', () => {
      expect(replaceString('{{`Value is: ${value}`}}', { value: 42 })).toBe(
        'Value is: 42',
      )
    })

    it('should handle template strings within expressions with fallback', () => {
      expect(
        replaceString(
          "{{ `${_.get(data, scope)?.amount ?? ''} ${_.get(data, scope)?.unit ?? 'kg'}` }}",
          {
            _: {
              get: (obj: any, path: string) => {
                const keys = path.split('.')
                let result = obj
                for (const key of keys) {
                  result = result?.[key]
                }
                return result
              },
            },
            data: { ctx: { amount: 5 } },
            scope: 'ctx',
          },
        ),
      ).toBe('5 kg')
    })
  })

  describe('security - prototype chain attacks', () => {
    it('should block constructor access on strings', () => {
      expect(() => replaceString('{{a.constructor}}', { a: '' })).toThrowError(
        "access to 'constructor' is not allowed",
      )
    })

    it('should block constructor chain to Function', () => {
      expect(() =>
        replaceString('{{a.constructor.constructor("return process")()}}', {
          a: '',
        }),
      ).toThrowError("access to 'constructor' is not allowed")
    })

    it('should block constructor chain on arrays', () => {
      expect(() =>
        replaceString(
          '{{[].constructor.constructor("return globalThis")()}}',
          {},
        ),
      ).toThrowError("access to 'constructor' is not allowed")
    })

    it('should block constructor chain on numbers', () => {
      expect(() =>
        replaceString(
          '{{(0).constructor.constructor("return process")()}}',
          {},
        ),
      ).toThrowError("access to 'constructor' is not allowed")
    })

    it('should block __proto__ access', () => {
      expect(() => replaceString('{{a.__proto__}}', { a: {} })).toThrowError(
        "access to '__proto__' is not allowed",
      )
    })

    it('should block computed __proto__ access', () => {
      expect(() => replaceString('{{a["__proto__"]}}', { a: {} })).toThrowError(
        "access to '__proto__' is not allowed",
      )
    })

    it('should block prototype access', () => {
      expect(() =>
        replaceString('{{a.prototype}}', { a: () => {} }),
      ).toThrowError("access to 'prototype' is not allowed")
    })

    it('should block computed constructor access via concatenation', () => {
      expect(() =>
        replaceString('{{a["constr" + "uctor"]}}', { a: '' }),
      ).toThrowError("access to 'constructor' is not allowed")
    })

    it('should block toString.constructor chain', () => {
      expect(() =>
        replaceString('{{a.toString.constructor}}', { a: '' }),
      ).toThrowError("access to 'constructor' is not allowed")
    })

    it('should block constructor access inside arrow function callbacks', () => {
      expect(() =>
        replaceString(
          '{{[1].map(x => x.constructor.constructor("return process")())}}',
          {},
        ),
      ).toThrowError("access to 'constructor' is not allowed")
    })

    it('should block process.env access even if passed indirectly', () => {
      expect(() =>
        replaceString('{{a.constructor.constructor("return process.env")()}}', {
          a: '',
        }),
      ).toThrowError("access to 'constructor' is not allowed")
    })

    it('should allow top-level arrow function as result', () => {
      const fn = replaceString('{{() => true}}', { a: 3 }) as (
        ...args: any[]
      ) => unknown
      expect(typeof fn).toBe('function')
      expect(fn()).toBe(true)
    })

    it('should allow top-level arrow function with params', () => {
      const fn = replaceString('{{(x) => x * 2}}', {}) as (
        ...args: any[]
      ) => unknown
      expect(typeof fn).toBe('function')
      expect(fn(5)).toBe(10)
    })

    it('should allow new for safe constructors', () => {
      const date = replaceString('{{new Date(2024, 0, 1)}}', {})
      expect(date).toBeInstanceOf(Date)
      expect((date as Date).getFullYear()).toBe(2024)
    })

    it('should block new for unsafe constructors', () => {
      expect(() =>
        replaceString('{{new (a.constructor.constructor)("return 1")}}', {
          a: '',
        }),
      ).toThrowError("access to 'constructor' is not allowed")
    })

    it('should block assignment expressions', () => {
      expect(() => replaceString('{{a = 2}}', { a: 1 })).toThrowError(
        'assignment is not allowed in template string',
      )
    })

    it('should block update expressions', () => {
      expect(() => replaceString('{{a++}}', { a: 1 })).toThrowError(
        'assignment is not allowed in template string',
      )
      expect(() => replaceString('{{a--}}', { a: 1 })).toThrowError(
        'assignment is not allowed in template string',
      )
    })

    it('should not leak scope variables', () => {
      // eslint-disable-next-line unused-imports/no-unused-vars
      const test1 = 'leaked'
      expect(() => replaceString('{{test1}}', {})).toThrowError(
        'test1 is not defined',
      )
    })

    it('should block __defineGetter__', () => {
      expect(() =>
        replaceString('{{a.__defineGetter__}}', { a: {} }),
      ).toThrowError("access to '__defineGetter__' is not allowed")
    })

    it('should block __lookupGetter__', () => {
      expect(() =>
        replaceString('{{a.__lookupGetter__}}', { a: {} }),
      ).toThrowError("access to '__lookupGetter__' is not allowed")
    })

    it('should block Function constructor via getOwnPropertyDescriptor', () => {
      expect(() =>
        replaceString(
          '{{ Object.getOwnPropertyDescriptor(Object.getPrototypeOf(() => {}), "constructor").value("return process.version")() }}',
          {},
        ),
      ).toThrowError()
    })

    it('should block Object.getOwnPropertyDescriptor', () => {
      expect(() =>
        replaceString('{{ Object.getOwnPropertyDescriptor({x: 1}, "x") }}', {}),
      ).toThrowError()
    })

    it('should block Object.getPrototypeOf', () => {
      expect(() =>
        replaceString('{{ Object.getPrototypeOf({}) }}', {}),
      ).toThrowError()
    })

    it('should block Object.setPrototypeOf', () => {
      expect(() =>
        replaceString('{{ Object.setPrototypeOf(a, {}) }}', { a: {} }),
      ).toThrowError()
    })

    it('should block Object.defineProperty', () => {
      expect(() =>
        replaceString('{{ Object.defineProperty(a, "x", { value: 1 }) }}', {
          a: {},
        }),
      ).toThrowError()
    })

    it('should block Object.create', () => {
      expect(() =>
        replaceString('{{ Object.create(null) }}', {}),
      ).toThrowError()
    })

    it('should keep Object.keys/values/entries/assign working', () => {
      expect(
        replaceString('{{ Object.keys(a) }}', { a: { x: 1, y: 2 } }),
      ).toStrictEqual(['x', 'y'])

      expect(
        replaceString('{{ Object.values(a) }}', { a: { x: 1, y: 2 } }),
      ).toStrictEqual([1, 2])

      expect(
        replaceString('{{ Object.entries(a) }}', { a: { x: 1 } }),
      ).toStrictEqual([['x', 1]])

      expect(
        replaceString('{{ Object.assign({}, a, b) }}', {
          a: { x: 1 },
          b: { y: 2 },
        }),
      ).toStrictEqual({ x: 1, y: 2 })
    })

    it('should keep instanceof Object working', () => {
      expect(replaceString('{{ a instanceof Object }}', { a: {} })).toBe(true)
      expect(replaceString('{{ a instanceof Array }}', { a: [1] })).toBe(true)
      expect(replaceString('{{ a instanceof Date }}', { a: new Date() })).toBe(
        true,
      )
    })

    it('should block import()', () => {
      expect(() => replaceString('{{ import("fs") }}', {})).toThrowError()
    })

    it('should block delete operator', () => {
      expect(() =>
        replaceString('{{ delete a.x }}', { a: { x: 1 } }),
      ).toThrowError()
    })

    it('should block Reflect/Proxy/Symbol globals', () => {
      expect(() => replaceString('{{ Reflect }}', {})).toThrowError(
        'Reflect is not defined',
      )
      expect(() => replaceString('{{ Proxy }}', {})).toThrowError(
        'Proxy is not defined',
      )
      expect(() => replaceString('{{ Symbol }}', {})).toThrowError(
        'Symbol is not defined',
      )
    })

    it('should block for/while loops in block bodies', () => {
      const forFn = replaceString(
        '{{ () => { for (let i = 0; i < 10; i++) {} return 1; } }}',
        {},
      ) as (...args: any[]) => unknown
      expect(() => forFn()).toThrowError()

      const whileFn = replaceString('{{ () => { while (true) {} } }}', {}) as (
        ...args: any[]
      ) => unknown
      expect(() => whileFn()).toThrowError()
    })

    it('should block try/catch in block bodies', () => {
      const fn = replaceString(
        '{{ () => { try { return a.constructor } catch(e) { return "caught" } } }}',
        { a: '' },
      ) as (...args: any[]) => unknown
      expect(() => fn()).toThrowError()
    })

    it('should block multiple top-level statements', () => {
      expect(() => replaceString('{{ a; b }}', { a: 1, b: 2 })).toThrowError(
        'only single expressions are allowed',
      )
    })

    it('should block all compound assignment operators', () => {
      const ops = [
        '+=',
        '-=',
        '*=',
        '/=',
        '%=',
        '**=',
        '<<=',
        '>>=',
        '&=',
        '^=',
        '|=',
        '&&=',
        '||=',
        '??=',
      ]
      for (const op of ops) {
        expect(() => replaceString(`{{a${op}2}}`, { a: 3 }), op).toThrowError(
          'assignment is not allowed in template string',
        )
      }
    })

    it('should block all Node.js/browser globals', () => {
      const globals = [
        'process',
        'Buffer',
        'setTimeout',
        'setInterval',
        'fetch',
        'URL',
        'TextEncoder',
        'queueMicrotask',
        'AbortController',
        'performance',
        'crypto',
        'require',
        'module',
        'exports',
        'global',
        'window',
        'document',
        'self',
        'globalThis',
      ]
      for (const name of globals) {
        expect(() => replaceString(`{{ ${name} }}`, {}), name).toThrowError(
          `${name} is not defined`,
        )
      }
    })

    it('should block constructor access via any method chain', () => {
      expect(() =>
        replaceString('{{ Array.isArray.constructor }}', {}),
      ).toThrowError("access to 'constructor' is not allowed")
      expect(() =>
        replaceString('{{ Math.max.constructor }}', {}),
      ).toThrowError("access to 'constructor' is not allowed")
      expect(() =>
        replaceString('{{ JSON.parse.constructor }}', {}),
      ).toThrowError("access to 'constructor' is not allowed")
    })

    it('should not leak closure variables', () => {
      const _secret = 'should not be accessible'
      expect(() => replaceString('{{ _secret }}', {})).toThrowError(
        '_secret is not defined',
      )
    })

    it('should block sequence/comma expressions', () => {
      expect(() => replaceString('{{ (1, 2, 3) }}', {})).toThrowError(
        'sequence expressions are not allowed',
      )
    })

    it('returned arrow function cannot access variables outside its scope', () => {
      const fn = replaceString('{{ () => outsideVar }}', {}) as () => unknown
      expect(() => fn()).toThrowError('outsideVar is not defined')
    })

    it('should not pollute Object.prototype via Object.assign', () => {
      const target = {}
      replaceString('{{ Object.assign(t, src) }}', {
        t: target,
        src: { normal: true },
      })
      expect((target as any).normal).toBe(true)
      // Verify no prototype pollution
      expect(({} as any).normal).toBeUndefined()
    })
  })

  describe('security - DoS protection', () => {
    it('should limit expression depth', () => {
      // Build a deeply nested ternary: true ? (true ? (true ? ... : 0) : 0) : 0
      let expr = '1'
      for (let i = 0; i < 300; i++) {
        expr = `(true ? ${expr} : 0)`
      }
      expect(() => replaceString(`{{${expr}}}`, {})).toThrowError(
        'expression too complex',
      )
    })

    it('should limit function call count via many array operations', () => {
      const bigArray = new Array(20000).fill(1)
      expect(() =>
        replaceString('{{ arr.map(x => x + 1).map(x => x + 1) }}', {
          arr: bigArray,
        }),
      ).toThrowError('call limit exceeded')
    })

    it('should limit call count in reduce with many iterations', () => {
      const bigArray = new Array(20000).fill(1)
      expect(() =>
        replaceString('{{ arr.reduce((a, b) => a + b, 0) }}', {
          arr: bigArray,
        }),
      ).toThrowError('call limit exceeded')
    })

    it('should limit string length from repeat', () => {
      expect(() => replaceString("{{ 'x'.repeat(2000000) }}", {})).toThrowError(
        'string length limit exceeded',
      )
    })

    it('should limit string length from concatenation', () => {
      const big = 'x'.repeat(600_000)
      expect(() =>
        replaceString('{{ a + b }}', { a: big, b: big }),
      ).toThrowError('string length limit exceeded')
    })

    it('should limit string length in template literals', () => {
      const big = 'x'.repeat(600_000)
      expect(() =>
        replaceString('{{ `${a}${b}` }}', { a: big, b: big }),
      ).toThrowError('string length limit exceeded')
    })

    it('should allow reasonable expression depth', () => {
      let expr = '1'
      for (let i = 0; i < 50; i++) {
        expr = `(true ? ${expr} : 0)`
      }
      expect(replaceString(`{{${expr}}}`, {})).toBe(1)
    })

    it('should allow reasonable call count', () => {
      const arr = new Array(100).fill(1)
      expect(
        replaceString('{{ arr.reduce((a, b) => a + b, 0) }}', { arr }),
      ).toBe(100)
    })
  })

  describe('security - symbol property access', () => {
    it('should block Symbol.toPrimitive access', () => {
      const obj = { [Symbol.toPrimitive]: () => 42 }
      expect(() =>
        replaceString('{{ obj[key] }}', { obj, key: Symbol.toPrimitive }),
      ).toThrowError('symbol property access is not allowed')
    })

    it('should block Symbol.unscopables access', () => {
      expect(() =>
        replaceString('{{ obj[key] }}', { obj: {}, key: Symbol.unscopables }),
      ).toThrowError('symbol property access is not allowed')
    })

    it('should block Symbol.iterator access', () => {
      expect(() =>
        replaceString('{{ obj[key] }}', { obj: [], key: Symbol.iterator }),
      ).toThrowError('symbol property access is not allowed')
    })
  })

  describe('coverage - additional branches', () => {
    it('template literal with ${} inside backticks is valid', () => {
      // Covers the inTemplate branch in the ${} validator
      expect(replaceString('{{ `hello ${name}` }}', { name: 'world' })).toBe(
        'hello world',
      )
    })

    it('computed method call on object', () => {
      // Covers callee.computed branch in CallExpression
      const obj = { greet: () => 'hello' }
      expect(replaceString("{{ obj['greet']() }}", { obj })).toBe('hello')
    })

    it('optional call on null function', () => {
      // Covers node.optional && func == null in CallExpression
      expect(replaceString('{{ fn?.() }}', { fn: null })).toBeUndefined()
    })

    it('call on null object method', () => {
      // Covers thisArg == null in CallExpression MemberExpression path
      expect(() => replaceString('{{ a.foo() }}', { a: null })).toThrowError(
        "Cannot read properties of null (reading 'foo')",
      )
    })

    it('tagged template literal', () => {
      // Covers TaggedTemplateExpression branch
      const tag = (strings: string[], ...values: any[]) =>
        strings.reduce((r, s, i) => r + s + (values[i] ?? ''), '')
      expect(
        replaceString('{{ tag`hello ${name}` }}', { tag, name: 'world' }),
      ).toBe('hello world')
    })

    it('arrow function with rest parameter', () => {
      // Covers RestElement branch in createSafeFunction
      const fn = replaceString('{{ (...args) => args.length }}', {}) as (
        ...args: any[]
      ) => unknown
      expect(fn(1, 2, 3)).toBe(3)
    })

    it('arrow function with default parameter', () => {
      // Covers AssignmentPattern branch in createSafeFunction
      const fn = replaceString('{{ (a, b = 10) => a + b }}', {}) as (
        ...args: any[]
      ) => unknown
      expect(fn(5)).toBe(15)
      expect(fn(5, 20)).toBe(25)
    })

    it('spread in function arguments', () => {
      // Covers SpreadElement in evaluateArguments
      expect(replaceString('{{ Math.max(...arr) }}', { arr: [1, 5, 3] })).toBe(
        5,
      )
    })

    it('sparse array elements', () => {
      // Covers el === null in evaluateArrayElements (holey arrays)

      expect(replaceString('{{ [1,,3] }}', {})).toStrictEqual([1, undefined, 3])
    })

    it('bitwise operators coverage', () => {
      // Covers &, |, ^ branches
      expect(replaceString('{{ a & b }}', { a: 0b1100, b: 0b1010 })).toBe(
        0b1000,
      )
      expect(replaceString('{{ a | b }}', { a: 0b1100, b: 0b1010 })).toBe(
        0b1110,
      )
      expect(replaceString('{{ a ^ b }}', { a: 0b1100, b: 0b1010 })).toBe(
        0b0110,
      )
    })

    it('modulo and exponent operators', () => {
      // Covers % and ** branches
      expect(replaceString('{{ a % b }}', { a: 7, b: 3 })).toBe(1)
      expect(replaceString('{{ a ** b }}', { a: 2, b: 3 })).toBe(8)
    })

    it('logical || and ?? operators', () => {
      // Covers || and ?? branches in LogicalExpression
      expect(replaceString('{{ a || b }}', { a: false, b: 'fallback' })).toBe(
        'fallback',
      )
      expect(replaceString('{{ a ?? b }}', { a: null, b: 'default' })).toBe(
        'default',
      )
    })

    it('unary +, void, ~ operators', () => {
      // Covers +, void, ~ branches in UnaryExpression
      expect(replaceString("{{ +'42' }}", {})).toBe(42)
      expect(replaceString('{{ void 0 }}', {})).toBeUndefined()
      expect(replaceString('{{ ~0 }}', {})).toBe(-1)
    })

    it('typeof on undefined variable', () => {
      // Covers the typeof special case for undefined identifiers
      expect(replaceString('{{ typeof missing }}', {})).toBe('undefined')
    })

    it('object with computed key', () => {
      // Covers prop.computed branch in ObjectExpression
      expect(
        replaceString('{{ ({ [key]: 42 }) }}', { key: 'x' }),
      ).toStrictEqual({ x: 42 })
    })

    it('object with spread', () => {
      // Covers SpreadElement in ObjectExpression
      expect(
        replaceString('{{ ({ ...a, x: 1 }) }}', { a: { y: 2 } }),
      ).toStrictEqual({ y: 2, x: 1 })
    })

    it('variable declaration without initializer', () => {
      // Covers declarator.init falsy branch
      const fn = replaceString(
        '{{ () => { const x = undefined; return x; } }}',
        {},
      ) as (...args: any[]) => unknown
      expect(fn()).toBeUndefined()
    })

    it('if statement without else', () => {
      // Covers node.alternate falsy in IfStatement
      const fn = replaceString(
        "{{ (x) => { if (x > 0) { return 'yes'; } return 'no'; } }}",
        {},
      ) as (...args: any[]) => unknown
      expect(fn(1)).toBe('yes')
      expect(fn(-1)).toBe('no')
    })

    it('return without argument', () => {
      // Covers node.argument falsy in ReturnStatement
      const fn = replaceString('{{ () => { return; } }}', {}) as (
        ...args: any[]
      ) => unknown
      expect(fn()).toBeUndefined()
    })

    it('formatCallee with computed member', () => {
      // Covers computed branch in formatCallee and non-function error
      expect(() =>
        replaceString('{{ obj["notAFn"]() }}', { obj: { notAFn: 42 } }),
      ).toThrowError('is not a function')
    })

    it('new with blocked constructor', () => {
      // Covers ALLOWED_CONSTRUCTORS check failing
      expect(() =>
        replaceString('{{ new WeakMap() }}', { WeakMap }),
      ).toThrowError("'new WeakMap' is not allowed")
    })

    it('member expression property from literal value', () => {
      // Covers (node.property as any).value path for non-computed members
      expect(replaceString('{{ a[0] }}', { a: ['first'] })).toBe('first')
    })
  })

  describe('block body arrow functions', () => {
    it('calcDuration - block body with const, new Date, if/return', () => {
      const calcDuration = replaceString(
        '{{ (entry) => { const start = new Date(entry.start); const end = new Date(entry.end); if (start.getTime() >= end.getTime()) return 0; return Math.round((end.getTime() - start.getTime()) / 1000); } }}',
        {},
      ) as (...args: any[]) => unknown

      expect(typeof calcDuration).toBe('function')

      expect(
        calcDuration({
          start: '2024-01-01T08:00:00Z',
          end: '2024-01-01T09:00:00Z',
        }),
      ).toBe(3600)

      expect(
        calcDuration({
          start: '2024-01-01T10:00:00Z',
          end: '2024-01-01T08:00:00Z',
        }),
      ).toBe(0)
    })

    it('totalDuration - reduce with function call from view', () => {
      const calcDuration = (entry: any) => {
        const start = new Date(entry.start)
        const end = new Date(entry.end)
        if (start.getTime() >= end.getTime()) return 0
        return Math.round((end.getTime() - start.getTime()) / 1000)
      }

      const result = replaceString(
        '{{ data?.timeEntries?.reduce((sum, entry) => sum + (variables.calcDuration(entry) * ((entry.tempUserIds?.length ?? 0) + (entry.userIds?.length ?? 0))), 0) ?? 0 }}',
        {
          data: {
            timeEntries: [
              {
                start: '2024-01-01T08:00:00Z',
                end: '2024-01-01T09:00:00Z',
                userIds: ['user1', 'user2'],
                tempUserIds: [],
              },
              {
                start: '2024-01-01T10:00:00Z',
                end: '2024-01-01T11:30:00Z',
                userIds: ['user1'],
                tempUserIds: ['temp1'],
              },
            ],
          },
          variables: { calcDuration },
        },
      )

      expect(result).toBe(3600 * 2 + 5400 * 2)
    })

    it('block body with multiple const declarations', () => {
      const fn = replaceString(
        '{{ (a, b) => { const sum = a + b; const doubled = sum * 2; return doubled; } }}',
        {},
      ) as (...args: any[]) => unknown
      expect(fn(3, 4)).toBe(14)
    })

    it('block body with if/else', () => {
      const fn = replaceString(
        "{{ (x) => { if (x > 0) { return 'positive'; } else { return 'non-positive'; } } }}",
        {},
      ) as (...args: any[]) => unknown
      expect(fn(5)).toBe('positive')
      expect(fn(-1)).toBe('non-positive')
    })

    it('new Date is allowed inside arrow body', () => {
      const fn = replaceString(
        '{{ (ts) => { const d = new Date(ts); return d.getFullYear(); } }}',
        {},
      ) as (...args: any[]) => unknown
      expect(fn('2024-06-15T00:00:00Z')).toBe(2024)
    })

    it('new Map is allowed', () => {
      const m = replaceString('{{new Map()}}', {})
      expect(m).toBeInstanceOf(Map)
    })

    it('new Set is allowed', () => {
      const s = replaceString('{{new Set([1, 2, 3])}}', {})
      expect(s).toBeInstanceOf(Set)
      expect((s as Set<number>).size).toBe(3)
    })
  })
})
