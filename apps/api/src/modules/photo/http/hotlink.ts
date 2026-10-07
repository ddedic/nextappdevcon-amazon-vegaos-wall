/**
 * True when a browser loads the resource for a page that isn't ours (another site's
 * <img>). Non-browser clients like the TV app send neither header and pass.
 */
export function isHotlinked(
  headers: { referer?: string; secFetchSite?: string },
  allowedOrigins: string[],
  selfOrigin: string,
): boolean {
  const referer = parseOrigin(headers.referer);
  if (referer) return referer !== selfOrigin && !allowedOrigins.includes(referer);
  return headers.secFetchSite === "cross-site";
}

function parseOrigin(value: string | undefined): string | undefined {
  if (!value) return undefined;
  try {
    return new URL(value).origin;
  } catch {
    return undefined;
  }
}
