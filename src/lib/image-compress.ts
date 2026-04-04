import imageCompression from "browser-image-compression";

const MAX_MB = 1;
const MAX_EDGE = 1920;

export async function compressCheckInImage(file: File): Promise<File> {
  return imageCompression(file, {
    maxSizeMB: MAX_MB,
    maxWidthOrHeight: MAX_EDGE,
    useWebWorker: true,
  });
}
