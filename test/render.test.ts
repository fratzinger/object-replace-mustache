import { render } from '../src/render'

describe('render.test.ts', () => {
  it('is silent by default', () => {
    expect(render('Hello {{ test }}', {})).toStrictEqual('Hello {{ test }}')
  })

  it('should work with multiple replaces', () => {
    expect(
      render('Hello {{ test }}, here {{ who }} am!', {
        test: 'world',
        who: 'I',
      }),
    ).toStrictEqual('Hello world, here I am!')
  })

  it('should work number replaces', () => {
    expect(
      render('Hello {{ test }}!', {
        test: 2,
      }),
    ).toStrictEqual('Hello 2!')
  })

  it('should work with expressions', () => {
    expect(
      render('Hello {{ test.length }}, how {{ verb }} {{ you() }}?', {
        test: 'test',
        verb: 'are',
        you: () => 'you',
      }),
    ).toStrictEqual('Hello 4, how are you?')
  })

  it('should work with square brackets', () => {
    expect(
      render('Hello {{ test[0] }}!', {
        test: ['world'],
      }),
    ).toStrictEqual('Hello world!')
  })

  it('should work with square brackets for objects', () => {
    expect(
      render('Hello {{ test[yourName] }}!', {
        test: { name: 'world' },
        yourName: 'name',
      }),
    ).toStrictEqual('Hello world!')
  })

  it('should work with Math.min', () => {
    expect(
      render('Hello {{ Math.min(1, 2) }}!', {
        Math,
      }),
    ).toStrictEqual('Hello 1!')
  })

  it('replaces nullable with empty string', () => {
    expect(render('{{ undefined }}', {})).toStrictEqual('')
    expect(render('{{ null }}', {})).toStrictEqual('')
  })

  it('can format the result', () => {
    const template = '{{ value }}'
    const context = { value: 1234.56 }
    const format = (value: any) => `${value.toFixed(2)}€`

    expect(render(template, context, { format })).toStrictEqual('1234.56€')
  })

  describe('edge cases', () => {
    it('should handle adjacent templates', () => {
      expect(render('{{a}}{{b}}', { a: 'hello', b: 'world' })).toStrictEqual(
        'helloworld',
      )
    })

    it('should handle templates with no spacing between text', () => {
      expect(
        render('prefix{{value}}suffix', { value: 'middle' }),
      ).toStrictEqual('prefixmiddlesuffix')
    })

    it('should handle empty view object', () => {
      expect(render('Hello {{ test }}', {})).toStrictEqual('Hello {{ test }}')
    })

    it('should handle string with no templates', () => {
      expect(render('Hello world', { test: 'ignored' })).toStrictEqual(
        'Hello world',
      )
    })

    it('should handle whitespace in expressions', () => {
      expect(render('Result: {{  a  +  b  }}', { a: 1, b: 2 })).toStrictEqual(
        'Result: 3',
      )
    })

    it('should handle multiple templates with same variable', () => {
      expect(render('{{x}} and {{x}} again', { x: 'test' })).toStrictEqual(
        'test and test again',
      )
    })
  })

  describe('format function edge cases', () => {
    it('should handle format function with null result', () => {
      const format = () => null as any
      expect(
        render('{{ value }}', { value: 'test' }, { format }),
      ).toStrictEqual('')
    })

    it('should handle format function with undefined result', () => {
      const format = () => undefined as any
      expect(
        render('{{ value }}', { value: 'test' }, { format }),
      ).toStrictEqual('')
    })

    it('should handle format function that coerces to string', () => {
      const format = (value: any) => value * 2
      expect(render('{{ value }}', { value: 5 }, { format })).toStrictEqual(
        '10',
      )
    })

    it('should apply format to all replacements', () => {
      const format = (value: any) => `[${value}]`
      expect(
        render('{{a}} and {{b}}', { a: 'x', b: 'y' }, { format }),
      ).toStrictEqual('[x] and [y]')
    })
  })

  describe('handleError option', () => {
    it('should ignore errors by default', () => {
      expect(render('{{ missing }}', {})).toStrictEqual('{{ missing }}')
    })

    it("should explicitly ignore errors with handleError: 'ignore'", () => {
      expect(
        render('{{ missing }}', {}, { handleError: 'ignore' }),
      ).toStrictEqual('{{ missing }}')
    })

    it("should throw errors with handleError: 'throw'", () => {
      expect(() => {
        render('{{ missing }}', {}, { handleError: 'throw' })
      }).toThrow()
    })
  })
})
