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

    it('function', () => {
      expect(() => replaceString('{{() => true}}', { a: 3 })).toBeTypeOf(
        'function',
      )
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
        'arguments is not allowed in template string',
      )
    })

    it('should throw with prohibited keywords', () => {
      expect(
        () =>
          replaceString('{{await name}}', {
            name: 'world',
          }),
        'without operator',
      ).toThrowError('await is not allowed in template string')

      expect(
        () =>
          replaceString('{{2+await name}}', {
            name: 'world',
          }),
        'with operator',
      ).toThrowError('await is not allowed in template string')
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
        'function is not allowed in template string',
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
})
