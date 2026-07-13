// Minimal ambient declaration for the ESM-only `file-type` package.
// The project uses classic ("node") module resolution, which cannot read
// file-type's `exports` map to locate its bundled types. This service only
// consumes `fileTypeFromBuffer` via a dynamic `import('file-type')`.
declare module 'file-type' {
  export interface FileTypeResult {
    ext: string;
    mime: string;
  }
  export function fileTypeFromBuffer(
    buffer: Uint8Array | ArrayBuffer,
  ): Promise<FileTypeResult | undefined>;
}
