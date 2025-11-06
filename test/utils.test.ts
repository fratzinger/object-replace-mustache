import {
  isPlainObject,
  regexForDelimiters,
  delimitersMustache,
} from '../src/utils'

describe('isPlainObject', () => {
  it('should return true for plain objects', () => {
    expect(isPlainObject({})).toBe(true)
    expect(isPlainObject({ a: 1 })).toBe(true)
    expect(isPlainObject({ a: 1, b: { c: 2 } })).toBe(true)
  })

  it('should return true for Object.create(null)', () => {
    expect(isPlainObject(Object.create(null))).toBe(true)
  })

  it('should return false for null and undefined', () => {
    expect(isPlainObject(null)).toBe(false)
    expect(isPlainObject(undefined)).toBe(false)
  })

  it('should return false for arrays', () => {
    expect(isPlainObject([])).toBe(false)
    expect(isPlainObject([1, 2, 3])).toBe(false)
  })

  it('should return false for dates', () => {
    expect(isPlainObject(new Date())).toBe(false)
  })

  it('should return false for custom class instances', () => {
    class CustomClass {}
    expect(isPlainObject(new CustomClass())).toBe(false)
  })

  it('should return false for Map and Set', () => {
    expect(isPlainObject(new Map())).toBe(false)
    expect(isPlainObject(new Set())).toBe(false)
  })

  it('should return false for primitives', () => {
    expect(isPlainObject(42)).toBe(false)
    expect(isPlainObject('string')).toBe(false)
    expect(isPlainObject(true)).toBe(false)
    expect(isPlainObject(false)).toBe(false)
    expect(isPlainObject(Symbol('test'))).toBe(false)
  })
})

describe('regexForDelimiters', () => {
  it('should create regex for mustache delimiters', () => {
    const regex = regexForDelimiters(['{{', '}}'])
    expect(regex.test('{{test}}')).toBe(true)
    expect(regex.test('test')).toBe(false)
    expect(regex.test('{{incomplete')).toBe(false)
    expect(regex.test('incomplete}}')).toBe(false)
  })

  it('should capture the inner expression', () => {
    const regex = regexForDelimiters(['{{', '}}'])
    const match = '{{test}}'.match(regex)
    expect(match).toBeTruthy()
    expect(match![1]).toBe('test')
  })

  it('should work with custom delimiters', () => {
    const regex = regexForDelimiters(['<%=', '%>'])
    expect(regex.test('<%=test%>')).toBe(true)
    expect(regex.test('{{test}}')).toBe(false)
  })

  it('should escape special regex characters in delimiters', () => {
    // Square brackets are special in regex
    const regex = regexForDelimiters(['[', ']'])
    expect(regex.test('[test]')).toBe(true)
    expect(regex.test('test')).toBe(false)
  })

  it('should escape parentheses delimiters', () => {
    const regex = regexForDelimiters(['((', '))'])
    expect(regex.test('((test))')).toBe(true)
    expect(regex.test('test')).toBe(false)
  })

  it('should work with flags parameter', () => {
    const regex = regexForDelimiters(['{{', '}}'], 'i')
    expect(regex.flags).toContain('i')
  })

  it('should match with non-greedy capture', () => {
    const regex = regexForDelimiters(['{{', '}}'])
    const match = '{{a + b}}'.match(regex)
    expect(match![1]).toBe('a + b')
  })

  it('should be anchored to start and end', () => {
    const regex = regexForDelimiters(['{{', '}}'])
    expect(regex.test('prefix{{test}}')).toBe(false)
    expect(regex.test('{{test}}suffix')).toBe(false)
  })
})

describe('delimitersMustache', () => {
  it('should export mustache delimiters', () => {
    expect(delimitersMustache).toEqual(['{{', '}}'])
  })
})
