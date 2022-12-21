# @neslinesli93/qpdf-wasm &middot; [![NPM Version](https://img.shields.io/npm/v/@neslinesli93/qpdf-wasm)](https://www.npmjs.com/package/@neslinesli93/qpdf-wasm)

[QPDF](https://github.com/qpdf/qpdf) compiled to WASM, ready for the browser.

Install with:

```bash
$ npm i @neslinesli93/qpdf-wasm
```

## Usage

Import the entrypoint `@neslinesli93/qpdf-wasm` and initialize it with a link to the wasm module, like so:

```js
import createModule from "@neslinesli93/qpdf-wasm";

(async () => {
  const qpdf = await createModule({
    // public url to the wasm module. can be served through a CDN or directly from your app (have a look at your bundler docs)
    locateFile: () => "@neslinesli93/qpdf-wasm/dist/qpdf.wasm",
  });

  // then invoke the entrypoint of qpdf, in this example just take the first two pages of the input PDF
  qpdf.callMain(["/input.pdf", "--pages", ".", "1-2", "--", "/output.pdf"]);
})();
```

## Local development

Build local image and launch tests with:

```bash
$ docker compose up
```
