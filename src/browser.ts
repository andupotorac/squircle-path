/**
 * Browser helpers for native CSS squircle support.
 *
 * The core path functions do not depend on the DOM. Import this entrypoint only
 * when you want to use native `corner-shape: squircle` where available.
 */

let nativeSquircleSupport: boolean | null = null;

export function supportsNativeSquircles(): boolean {
  if (nativeSquircleSupport !== null) return nativeSquircleSupport;

  if (typeof CSS === "undefined" || typeof CSS.supports !== "function") {
    nativeSquircleSupport = false;
    return nativeSquircleSupport;
  }

  nativeSquircleSupport = CSS.supports("corner-shape", "squircle");
  return nativeSquircleSupport;
}

export function applyNativeSquircle(element: HTMLElement, radius: string): void {
  element.style.borderRadius = radius;
  element.style.setProperty("corner-shape", "squircle");
}

export function removeNativeSquircle(element: HTMLElement): void {
  element.style.borderRadius = "";
  element.style.removeProperty("corner-shape");
}
