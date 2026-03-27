import { Bench } from 'tinybench'
import { replace, replaceString, render } from '../src/index'
import { safeEval } from '../src/safe-eval'
import { parseScript } from 'meriyah'
import Mustache from 'mustache'
import Handlebars from 'handlebars'
import ejs from 'ejs'

const bench = new Bench({ time: 1000 })

// --- replaceString ---

bench.add('replaceString: simple property', () => {
  replaceString('{{name}}', { name: 'John' })
})

bench.add('replaceString: nested property', () => {
  replaceString('{{user.name}}', { user: { name: 'John' } })
})

bench.add('replaceString: expression', () => {
  replaceString('{{a + b}}', { a: 1, b: 2 })
})

bench.add('replaceString: template literal', () => {
  replaceString('{{`Hello ${name}!`}}', { name: 'World' })
})

bench.add('replaceString: no match (plain string)', () => {
  replaceString('hello world', {})
})

// --- render: single placeholder ---

bench.add('render: single placeholder', () => {
  render('Hello {{name}}!', { name: 'World' })
})

bench.add('mustache: single placeholder', () => {
  Mustache.render('Hello {{name}}!', { name: 'World' })
})

bench.add('handlebars: single placeholder (compile + render)', () => {
  Handlebars.compile('Hello {{name}}!')({ name: 'World' })
})

const hbsSingle = Handlebars.compile('Hello {{name}}!')
bench.add('handlebars: single placeholder (precompiled)', () => {
  hbsSingle({ name: 'World' })
})

bench.add('ejs: single placeholder (compile + render)', () => {
  ejs.render('Hello <%= name %>!', { name: 'World' })
})

const ejsSingle = ejs.compile('Hello <%= name %>!')
bench.add('ejs: single placeholder (precompiled)', () => {
  ejsSingle({ name: 'World' })
})

// --- render: multiple placeholders ---

bench.add('render: multiple placeholders', () => {
  render('{{greeting}}, {{name}}! You are {{age}} years old.', {
    greeting: 'Hello',
    name: 'John',
    age: 30,
  })
})

bench.add('mustache: multiple placeholders', () => {
  Mustache.render('{{greeting}}, {{name}}! You are {{age}} years old.', {
    greeting: 'Hello',
    name: 'John',
    age: 30,
  })
})

bench.add('handlebars: multiple placeholders (compile + render)', () => {
  Handlebars.compile('{{greeting}}, {{name}}! You are {{age}} years old.')({
    greeting: 'Hello',
    name: 'John',
    age: 30,
  })
})

const hbsMulti = Handlebars.compile(
  '{{greeting}}, {{name}}! You are {{age}} years old.',
)
bench.add('handlebars: multiple placeholders (precompiled)', () => {
  hbsMulti({ greeting: 'Hello', name: 'John', age: 30 })
})

bench.add('ejs: multiple placeholders (compile + render)', () => {
  ejs.render(
    '<%= greeting %>, <%= name %>! You are <%= age %> years old.',
    { greeting: 'Hello', name: 'John', age: 30 },
  )
})

const ejsMulti = ejs.compile(
  '<%= greeting %>, <%= name %>! You are <%= age %> years old.',
)
bench.add('ejs: multiple placeholders (precompiled)', () => {
  ejsMulti({ greeting: 'Hello', name: 'John', age: 30 })
})

// --- replace (object) ---

bench.add('replace: flat object', () => {
  replace(
    { name: '{{name}}', age: '{{age}}' },
    { name: 'John', age: 30 },
  )
})

bench.add('replace: nested object', () => {
  replace(
    {
      user: {
        name: '{{name}}',
        address: { city: '{{city}}' },
      },
      tags: ['{{tag1}}', '{{tag2}}'],
    },
    { name: 'John', city: 'Berlin', tag1: 'a', tag2: 'b' },
  )
})

bench.add('replace: large object (20 keys)', () => {
  const obj: Record<string, string> = {}
  const view: Record<string, string> = {}
  for (let i = 0; i < 20; i++) {
    obj[`key${i}`] = `{{val${i}}}`
    view[`val${i}`] = `value${i}`
  }
  replace(obj, view)
})

// --- eval vs safeEval ---

const simpleAst = parseScript('name')
const exprAst = parseScript('a + b')
const nestedAst = parseScript('user.name')
const templateAst = parseScript('`Hello ${name}!`')

bench.add('safeEval: simple property', () => {
  safeEval(simpleAst, { name: 'John' })
})

bench.add('eval: simple property', () => {
  const name = 'John'
  eval('name')
})

bench.add('safeEval: expression (a + b)', () => {
  safeEval(exprAst, { a: 1, b: 2 })
})

bench.add('eval: expression (a + b)', () => {
  const a = 1, b = 2
  eval('a + b')
})

bench.add('safeEval: nested property', () => {
  safeEval(nestedAst, { user: { name: 'John' } })
})

bench.add('eval: nested property', () => {
  const user = { name: 'John' }
  eval('user.name')
})

bench.add('safeEval: template literal', () => {
  safeEval(templateAst, { name: 'World' })
})

bench.add('eval: template literal', () => {
  const name = 'World'
  eval('`Hello ${name}!`')
})

// parse + safeEval vs eval (full pipeline)

bench.add('parse + safeEval: simple property', () => {
  safeEval(parseScript('name'), { name: 'John' })
})

bench.add('parse + safeEval: expression', () => {
  safeEval(parseScript('a + b'), { a: 1, b: 2 })
})

await bench.run()

console.table(bench.table())
