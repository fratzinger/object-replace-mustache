# object-replace-mustache

[![npm](https://img.shields.io/npm/v/object-replace-mustache)](https://www.npmjs.com/package/object-replace-mustache)
[![GitHub Workflow Status](https://img.shields.io/github/workflow/status/fratzinger/object-replace-mustache/Node.js%20CI)](https://github.com/fratzinger/object-replace-mustache/actions/workflows/node.js.yml?query=branch%3Amain++)
[![Code Climate maintainability](https://img.shields.io/codeclimate/maintainability/fratzinger/object-replace-mustache)](https://codeclimate.com/github/fratzinger/object-replace-mustache)
[![Code Climate coverage](https://img.shields.io/codeclimate/coverage/fratzinger/object-replace-mustache)](https://codeclimate.com/github/fratzinger/object-replace-mustache)
[![libraries.io](https://img.shields.io/librariesio/release/npm/object-replace-mustache)](https://libraries.io/npm/object-replace-mustache)
[![npm](https://img.shields.io/npm/dm/object-replace-mustache)](https://www.npmjs.com/package/object-replace-mustache)
[![GitHub license](https://img.shields.io/github/license/fratzinger/object-replace-mustache)](https://github.com/fratzinger/object-replace-mustache/blob/main/LICENSE)

This project uses the concepts of [mustache](https://github.com/janl/mustache.js/) for objects. Properties with `{{ stringsWithCurlyBrackets }}` placeholders get replaced by their corresponding view object properties. It's pretty useful for storing 'dynamic' objects in databases.

## Installation

```bash
npm i object-replace-mustache
```

## Usage

```ts
import { replace } from "object-replace-mustache";

const original = { isTest: "{{ nested.test }}" };

const view = { nested: { test: true } };

const transformed = replace(original, view);
console.log(transformed);
// { isTest: true }
```

### render

There is also a `render` function that is like mustache.js or handlebars

```ts
import { render } from "object-replace-mustache";

const rendered = render("hello { test }!", { test: "world" });
console.log(rendered);
// hello world!
```

## Testing

Simply run `npm test` and all your tests in the `test/` directory will be run. It has full support for _Visual Studio Code_. You can use the debugger to set breakpoints.

## License

Licensed under the [MIT license](LICENSE).
