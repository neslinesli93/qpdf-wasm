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

## Usage in browser with webpack

```js
import createModule from "@neslinesli93/qpdf-wasm";
const wasmUrl = "/wasm/qpdf.wasm"; // place the wasm file in your public folder or make it available through a CDN

const qpdf = await createModule({
    locateFile: () => wasmUrl,
    noInitialRun: true,
    preRun: [
        (module: any) => {
            // Ensure FS is available
            if (module.FS) {
                try {
                    module.FS.mkdir(INPUT_FOLDER);
                    module.FS.mkdir(OUTPUT_FOLDER);
                } catch (e) {
                    console.warn("Error creating directories:", e);
                }
            }
        },
    ],
});
```

also make sure webpack is configured to ignore NodeJS specific imports like `fs` and `path` by adding this to your webpack config:

```js
webpack: (config, { isServer }) => {
        if (!isServer) {
            config.resolve.fallback = {
                ...config.resolve.fallback,
                process: false,
                fs: false,
                path: false,
            };
        }
        return config;
    },
```

to actually use qpdf in the browser, you need to write the pdf files to virtual file system provided by the module:

```js
// prepare the input file
const file = await fetch(fileUrl); // can be ObjectUrl, BlobUrl or remote url
const fileBuffer = await file.arrayBuffer();
const uint8Array = new Uint8Array(fileBuffer);
const inputPath = "/input_file.pdf";
qpdf.FS.writeFile(inputPath, uint8Array);

// invoke qpdf
qpdf.callMain(["/input_file.pdf", "--pages", ".", "1-2", "--", "/output_file.pdf"]);

// read the output file and create a new objectUrl for example
const outputFile = qpdf.FS.readFile("/output_file.pdf");
const outputFileUrl = URL.createObjectURL(new Blob([outputFile]));

```

## qpdf's messages

qpdf writes its output to standard output and its warnings and errors (for example "file is damaged") to standard error. By default they go to `console.log` and `console.error`. Pass `print` and `printErr` to receive them line by line:

```js
const warnings = [];
const qpdf = await createModule({
    locateFile: () => wasmUrl,
    printErr: (line) => warnings.push(line),
});
```

## Calling qpdf many times in one instance

Each `callMain` copies its arguments onto the WebAssembly stack (64 KB) and leaves them there, so one instance runs out of stack after a few hundred calls, or fewer with long argument lists. Save the stack pointer before each call and restore it afterwards:

```js
const stack = qpdf.stackSave();
try {
    qpdf.callMain(["/input.pdf", "--pages", ".", "1-2", "--", "/output.pdf"]);
} finally {
    qpdf.stackRestore(stack);
}
```

`callMain` also adds the program's name to the front of the array it's given, so pass a new array to each call.

## Browser support

qpdf is compiled with WebAssembly exception handling, which it needs to recover damaged files. It runs in Chrome and Edge 95, Firefox 100, Safari 15.2, Node.js 17 and later versions.

## Local development

Build local image and launch tests with:

```bash
$ docker compose up
```
