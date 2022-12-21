declare module "@neslinesli93/qpdf-wasm" {
  interface QpdfModule {
    ({ locateFile }: { locateFile: () => string }): Promise<QpdfInstance>;
  }

  interface QpdfInstance {
    callMain: (args: string[]) => number;
    FS: EmscriptenFS;
    WORKERFS: any;
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
  export type { QpdfInstance };
}
