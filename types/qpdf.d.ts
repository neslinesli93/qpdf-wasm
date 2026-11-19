declare module "@neslinesli93/qpdf-wasm" {
  interface QpdfOptions {
    locateFile?: () => string;
    noInitialRun?: boolean;
    noFSInit?: boolean;
    preRun?: ((module: QpdfInstance) => void)[];
    /** Receives each line qpdf writes to standard output, in place of `console.log`. */
    print?: (line: string) => void;
    /** Receives each line qpdf writes to standard error (warnings and errors), in place of `console.error`. */
    printErr?: (line: string) => void;
  }

  interface QpdfModule {
    (options?: QpdfOptions): Promise<QpdfInstance>;
  }

  interface QpdfInstance {
    callMain: (args: string[]) => number;
    FS: EmscriptenFS;
    WORKERFS: any;
    /** Reads the WebAssembly stack pointer. */
    stackSave: () => number;
    /** Puts back a stack pointer read by `stackSave`, freeing what `callMain` left on the stack. */
    stackRestore: (pointer: number) => void;
  }

  interface EmscriptenFS {
    mkdir: (path: string) => void;
    mount: (
      type: QpdfInstance["WORKERFS"],
      opts: { blobs: { name: string; data: Blob }[] },
      mountPoint: string
    ) => void;
    unmount: (mountPoint: string) => void;
    readFile: (path: string) => Uint8Array;
  }

  const module: QpdfModule;
  export default module;
  export type { QpdfInstance, QpdfOptions };
}
