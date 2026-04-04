/**
 * Extract Storage object path from a Firebase download URL (v0 API).
 * Returns null if URL không khớp định dạng.
 */
export function storagePathFromDownloadUrl(url: string): string | null {
  try {
    const u = new URL(url);
    if (!u.hostname.includes("firebasestorage.googleapis.com")) return null;
    const idx = u.pathname.indexOf("/o/");
    if (idx === -1) return null;
    const encoded = u.pathname.slice(idx + 3);
    if (!encoded) return null;
    return decodeURIComponent(encoded.split("?")[0] ?? "");
  } catch {
    return null;
  }
}
