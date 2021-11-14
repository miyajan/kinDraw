// write changedpi's type definition file because I can't find it
declare module "changedpi" {
  export function changeDpiBlob(blob: Blob, dpi: number): Promise<Blob>;
  export function changeDpiDataUrl(base64Image: string, dpi: number): string;
}
