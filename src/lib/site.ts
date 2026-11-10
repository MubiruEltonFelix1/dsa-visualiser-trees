/**
 * Single source of truth for product branding and shareable metadata.
 * Used by the route `head()` handlers so titles, descriptions and canonical
 * URLs stay consistent across the root shell and individual pages.
 */
export const SITE_NAME = "TreeViz";
export const SITE_TAGLINE = "Interactive Data Structure Laboratory";
export const SITE_DESCRIPTION =
  "Explore general trees, binary search trees, AVL balancing, 2-3 trees and Red-Black trees with interactive traversals and reversible operation timelines.";

const configuredSiteUrl = import.meta.env.VITE_PUBLIC_SITE_URL?.trim() ?? "";

/**
 * Deployment origin with any trailing slash removed, or an empty string when
 * `VITE_PUBLIC_SITE_URL` is not configured. Set it in production so canonical
 * and Open Graph URLs resolve against your own domain.
 */
export const SITE_URL = configuredSiteUrl.replace(/\/+$/, "");

/** Absolute URL for a site-relative path, or a relative path when no origin is configured. */
export function absoluteUrl(path: string): string {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return SITE_URL ? `${SITE_URL}${normalized}` : normalized;
}
