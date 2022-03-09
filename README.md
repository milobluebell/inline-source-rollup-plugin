# rollup-plugin-inline-sources

A rollup plugin to embed static source into the html file.

## Install

```shell
npm install rollup-plugin-inline-sources --save-dev
```

## Usage

Create a `rollup.config.js` [configuration file](https://www.rollupjs.org/guide/en/#configuration-files) and import the plugin:

```js
import inlineResource from "rollup-plugin-inline-sources";

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

No one is required.

### `includes`

Type: `string[] | RegExp`<br>
Default: `/\.(js|css)$/`

Specifies extension names of resources that will be inlay into html file.

\_Note: If using the `RegExp` data type, it will compare with the whole resource's name, not only based onto extname.

### `excludes`

Type: `RegExp`<br>
Default: `/\.(svg|jpg)$/`

### `excludeAttrs`

Type: `Array<{ key: string, value: string } | string>`<br>
Default: `['async', 'defer', { key: 'type', value: 'module' }, { key: 'rel', value: 'modulepreload' }]`

Specifies the attributes whick would cause resource being ignored by this plugin's inlay.

### `base`

Type: `string`<br>
Default: `''`

Specifies the public path of assets and any other resources.

### `nonMatched`

Type: `2 | 1 | 0 | 'error' | 'warn' | 'none'`<br>
Default: `2`

Specifies the level of error catcher,when it was `2` or `error`,it will shut down the whole build work. others won't.

### `cache`

Type: `boolean`<br>
Default: `true`

Turn on this will cache remote 'curl'led download resources for the, it will decrease time spending for next curl download for resource who's name was unchanged.

\_Note: It's not support yet

### `bundleTransform`


Type: `(bundleName: string, bundleCode: string | undefined) => string`<br>
Default: `() => void 0`;

It's a callback function launched in `generateBundle` lifecycle. you can read bundle's content by the second argument `bundleCode`, or specifies output with '`return` something'. so as concidering, it's dangerous, untill you was quite sure of what you are doing.

\_Note: Dangerous usage.


## Dynamic Imports

no plan to support it yet. if it is necessary for you please open an issue

[LICENSE (MIT)](/LICENSE)
