# @rollup/plugin-data-uri

A rollup plugin to embed static resource into the html file.

## Install

```console
npm install @rollup/plugin-inline-resource --save-dev
```

## Usage

Create a `rollup.config.js` [configuration file](https://www.rollupjs.org/guide/en/#configuration-files) and import the plugin:

```js
import inlineResource from "@rollup/plugin-inline-resource";

module.exports = {
  input: "src/index.js",
  output: {
    dir: "output",
    format: "cjs",
  },
  plugins: [inlineResource()],
};
```

## Options

### `include`

Type: `string[] | RegExp`<br>
Default: `/\.(js|css)$/`

Specifies additional attributes for `html`, `link`, and `script` elements. For each property, provide an object with key-value pairs that represent an HTML element attribute name and value. By default, the `html` element is rendered with an attribute of `lang="en"`.

_Note: If using the `es` / `esm` output format, `{ type: 'module'}` is automatically added to `attributes.script`._

### `compress`

Type: `boolean`<br>
Default: `/\.(js|css)$/`

## Dynamic Imports

no plan to support it yet. if it is necessary for you please open an issue

[LICENSE (MIT)](/LICENSE)
