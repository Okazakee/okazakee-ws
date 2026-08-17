/**
 * Legacy CMS route detection (public site side, client-safe, unit-tested).
 *
 * Only /{locale}/cms and /{locale}/cms/<path> match. `/cms` must be an exact
 * segment, so `/something-cms-whatever` never triggers the cutover redirect.
 */
const LEGACY_CMS_ROUTE_PATTERN = /^\/[a-z]{2}\/cms(?:\/.*)?$/;
const CMS_SEGMENT_PATTERN = /\/cms(?=\/|$)/;

export function isLegacyCmsRoute(pathname: string): boolean {
  return LEGACY_CMS_ROUTE_PATTERN.test(pathname);
}

/**
 * Removes the first `/cms` segment. Only meaningful when
 * isLegacyCmsRoute(pathname) is true; other paths are returned unchanged.
 */
export function stripLegacyCmsSegment(pathname: string): string {
  return pathname.replace(CMS_SEGMENT_PATTERN, '');
}
