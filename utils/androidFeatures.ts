/**
 * Android Native Features & Utilities:
 * - Haptic vibration feedback (navigator.vibrate)
 * - Screen WakeLock API to keep display on during putts
 * - PWA Install event management
 */

// Vibration settings
export const getHapticsEnabled = (): boolean => {
  if (typeof window === 'undefined') return true;
  const val = localStorage.getItem('golf_android_haptics');
  return val === null ? true : val === 'true';
};

export const setHapticsEnabled = (enabled: boolean): void => {
  if (typeof window === 'undefined') return;
  localStorage.setItem('golf_android_haptics', enabled ? 'true' : 'false');
};

/**
 * Triggers vibration if supported on Android and enabled
 */
export const vibrate = (pattern: number | number[]): void => {
  if (typeof window === 'undefined') return;
  if (!getHapticsEnabled()) return;
  
  if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    try {
      navigator.vibrate(pattern);
    } catch {
      // Ignored if user hasn't interacted or permission denied
    }
  }
};

export const vibratePutt = (power: number = 50): void => {
  // Scale vibration from 12ms to 35ms based on swing power
  const duration = Math.min(35, Math.max(12, Math.round((power / 100) * 35)));
  vibrate(duration);
};

export const vibrateCollision = (): void => {
  vibrate(10);
};

export const vibrateHoleInOne = (): void => {
  // Celebration burst pattern
  vibrate([40, 40, 80, 50, 140]);
};

export const vibrateCupSink = (): void => {
  vibrate([30, 40, 60]);
};

// Screen WakeLock management to keep Android screen awake while playing
let wakeLockSentinel: any = null;

export const requestWakeLock = async (): Promise<boolean> => {
  if (typeof window === 'undefined') return false;
  if ('wakeLock' in navigator) {
    try {
      wakeLockSentinel = await (navigator as any).wakeLock.request('screen');
      wakeLockSentinel.addEventListener('release', () => {
        wakeLockSentinel = null;
      });
      return true;
    } catch (err) {
      console.warn('Wake Lock request skipped or unsupported:', err);
      return false;
    }
  }
  return false;
};

export const releaseWakeLock = async (): Promise<void> => {
  if (wakeLockSentinel) {
    try {
      await wakeLockSentinel.release();
      wakeLockSentinel = null;
    } catch {
      // Ignore
    }
  }
};
