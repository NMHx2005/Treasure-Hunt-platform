/** Parse required lat/lng for spots. Returns null if invalid or out of range. */
export function parseRequiredLatLng(latStr: string, lngStr: string): { lat: number; lng: number } | null {
  const la = Number.parseFloat(latStr.trim());
  const ln = Number.parseFloat(lngStr.trim());
  if (!Number.isFinite(la) || !Number.isFinite(ln)) return null;
  if (la < -90 || la > 90 || ln < -180 || ln > 180) return null;
  return { lat: la, lng: ln };
}

/**
 * Optional center: both empty → null; one empty → "partial"; invalid range → "invalid".
 */
export function parseOptionalLatLng(
  latStr: string,
  lngStr: string,
): { lat: number; lng: number } | null | "partial" | "invalid" {
  const tLat = latStr.trim();
  const tLng = lngStr.trim();
  if (!tLat && !tLng) return null;
  if (!tLat || !tLng) return "partial";
  const la = Number.parseFloat(tLat);
  const ln = Number.parseFloat(tLng);
  if (!Number.isFinite(la) || !Number.isFinite(ln)) return "invalid";
  if (la < -90 || la > 90 || ln < -180 || ln > 180) return "invalid";
  return { lat: la, lng: ln };
}

export type Bounds = { ne: { lat: number; lng: number }; sw: { lat: number; lng: number } };

/**
 * Optional defaultBounds: all four empty → null; partial → "partial"; invalid → "invalid".
 */
export function parseOptionalBounds(
  neLat: string,
  neLng: string,
  swLat: string,
  swLng: string,
): Bounds | null | "partial" | "invalid" {
  const a = neLat.trim();
  const b = neLng.trim();
  const c = swLat.trim();
  const d = swLng.trim();
  if (!a && !b && !c && !d) return null;
  if (!a || !b || !c || !d) return "partial";
  const neLa = Number.parseFloat(a);
  const neLn = Number.parseFloat(b);
  const swLa = Number.parseFloat(c);
  const swLn = Number.parseFloat(d);
  if (![neLa, neLn, swLa, swLn].every(Number.isFinite)) return "invalid";
  if (neLa < -90 || neLa > 90 || swLa < -90 || swLa > 90) return "invalid";
  if (neLn < -180 || neLn > 180 || swLn < -180 || swLn > 180) return "invalid";
  return { ne: { lat: neLa, lng: neLn }, sw: { lat: swLa, lng: swLn } };
}

export const GEO_HINT = "Lat ∈ [-90, 90], Lng ∈ [-180, 180].";
