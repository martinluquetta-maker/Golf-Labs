/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Detects whether the current device is a computer (desktop / laptop / PC / Mac)
 * rather than a physical mobile phone / tablet.
 */
export function isComputerDevice(): boolean {
  if (typeof window === 'undefined') return false;

  const ua = navigator.userAgent || '';
  
  // Real mobile / tablet OS patterns
  const isMobileOS = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua);
  
  // iPads running modern iPadOS might report as Macintosh with touch points
  const isIPad = /Macintosh/i.test(ua) && navigator.maxTouchPoints > 1;
  const isActualMobileOrTablet = isMobileOS || isIPad;

  if (!isActualMobileOrTablet) {
    return true; // It is a computer (Windows, macOS desktop, Linux, etc.)
  }

  // Double check pointer precision: a desktop with a mouse has fine pointer and no coarse primary pointer
  const hasFinePointer = typeof window.matchMedia === 'function' && window.matchMedia('(pointer: fine)').matches;
  const hasNoCoarsePointer = typeof window.matchMedia === 'function' && !window.matchMedia('(pointer: coarse)').matches;
  if (hasFinePointer && hasNoCoarsePointer) {
    return true;
  }

  return false;
}
