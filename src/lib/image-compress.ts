import imageCompression from "browser-image-compression";

/** Target max output size after compression (MB). */
export const CHECK_IN_MAX_SIZE_MB = 1;
/** Max width/height edge after resize. */
export const CHECK_IN_MAX_EDGE_PX = 1920;

export async function compressCheckInImage(file: File): Promise<File> {
  return imageCompression(file, {
    maxSizeMB: CHECK_IN_MAX_SIZE_MB,
    maxWidthOrHeight: CHECK_IN_MAX_EDGE_PX,
    useWebWorker: true,
  });
}
