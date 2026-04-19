declare module "@jspawn/qpdf-wasm" {
  interface QpdfModule {
    FS: {
      writeFile(path: string, data: Uint8Array): void;
      readFile(path: string): Uint8Array;
      unlink(path: string): void;
    };
    callMain(args: string[]): void;
  }

  export default function createModule(): Promise<QpdfModule>;
}
