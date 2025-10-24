declare module 'qrcode' {
  export interface QRCodeOptions {
    width?: number;
    margin?: number;
    scale?: number;
    color?: {
      dark?: string;
      light?: string;
    };
    [key: string]: unknown;
  }

  export function toDataURL(text: string, options?: QRCodeOptions): Promise<string>;
  export function toDataURL(
    text: string,
    options: QRCodeOptions,
    callback: (error: Error | null, url: string) => void
  ): void;

  const QRCode: {
    toDataURL: typeof toDataURL;
  };

  export default QRCode;
}
