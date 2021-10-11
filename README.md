# object-replace-mustache

[![npm](https://img.shields.io/npm/v/xxx)](https://www.npmjs.com/package/xxx)
[![GitHub Workflow Status](https://img.shields.io/github/workflow/status/fratzinger/xxx/Node.js%20CI)](https://github.com/fratzinger/xxx/actions/workflows/node.js.yml?query=branch%3Amain++)
[![Code Climate maintainability](https://img.shields.io/codeclimate/maintainability/fratzinger/xxx)](https://codeclimate.com/github/fratzinger/xxx)
[![Code Climate coverage](https://img.shields.io/codeclimate/coverage/fratzinger/xxx)](https://codeclimate.com/github/fratzinger/xxx)
[![David](https://img.shields.io/david/fratzinger/xxx)](https://david-dm.org/fratzinger/xxx)
[![npm](https://img.shields.io/npm/dm/xxx)](https://www.npmjs.com/package/xxx)
[![GitHub license](https://img.shields.io/github/license/fratzinger/xxx)](https://github.com/fratzinger/xxx/blob/master/LICENSE)

This project uses the concepts of [mustache](https://github.com/janl/mustache.js/) for objects. Properties with `{{ stringsWithCurlyBrackets }}` placeholders get replaced by their corresponding view object properties. It's pretty useful for storing 'dynamic' objects in databases.

## Installation

```bash
npm i object-replace-mustache
```

## Usage

```ts
import replace from 'object-replace-mustache'

const original = { isTest: '{{ nested.test }}' };

const view = { nested: { test: true } }

const transformed = replace(original, view);
console.log(transformed)
// { isTest: true }
```

## Testing

Simply run `npm test` and all your tests in the `test/` directory will be run. It has full support for *Visual Studio Code*. You can use the debugger to set breakpoints.

## License

Licensed under the [MIT license](LICENSE).