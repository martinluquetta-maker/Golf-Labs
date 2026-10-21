/**
 * PWA & Android Update Manager
 * Handles Service Worker registration, automatic Over-The-Air update detection,
 * periodic update polling, cache busting, and forced refresh for PWABuilder TWAs.
 */

import { registerSW } from 'virtual:pwa-register';

export const APP_VERSION = '1.3.0';
export const BUILD_DATE = '2026-10-16';

type UpdateListener = (updateAvailable: boolean) => void;

class PWAUpdateManager {
  private updateSWFn: ((reloadPage?: boolean) => Promise<void>) | null = null;
  private registration: ServiceWorkerRegistration | null = null;
  private isUpdateReady: boolean = false;
  private listeners: Set<UpdateListener> = new Set();
  private isInitialized: boolean = false;
  private lastCheckTime: number = Date.now();

  public init() {
    if (this.isInitialized || typeof window === 'undefined') return;
    this.isInitialized = true;

    if ('serviceWorker' in navigator) {
      try {
        this.updateSWFn = registerSW({
          immediate: true,
          onNeedRefresh: () => {
            console.log('[PWA Manager] New update is available and waiting.');
            this.setUpdateReady(true);
          },
          onOfflineReady: () => {
            console.log('[PWA Manager] App is offline-ready.');
          },
          onRegisteredSW: (_swUrl, r) => {
            if (r) {
              this.registration = r;
              console.log('[PWA Manager] Service Worker registered successfully.');

              // Check for update on registration
              r.update().catch(() => {});

              // Listen for waiting service worker
              if (r.waiting) {
                this.setUpdateReady(true);
              }

              r.addEventListener('updatefound', () => {
                const installingWorker = r.installing;
                if (installingWorker) {
                  installingWorker.addEventListener('statechange', () => {
                    if (installingWorker.state === 'installed' && navigator.serviceWorker.controller) {
                      this.setUpdateReady(true);
                    }
                  });
                }
              });
            }
          },
          onRegisterError: (error) => {
            console.warn('[PWA Manager] Service Worker registration failed:', error);
          }
        });
      } catch (err) {
        console.warn('[PWA Manager] registerSW initialization error:', err);
      }

      // Check for updates when user returns to the app (PWA comes into focus)
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') {
          this.checkForUpdate();
        }
      });

      window.addEventListener('focus', () => {
        this.checkForUpdate();
      });

      // Poll periodically every 10 minutes
      setInterval(() => {
        this.checkForUpdate();
      }, 10 * 60 * 1000);
    }
  }

  private setUpdateReady(ready: boolean) {
    this.isUpdateReady = ready;
    this.listeners.forEach((listener) => listener(ready));
  }

  public subscribe(listener: UpdateListener): () => void {
    this.listeners.add(listener);
    // Immediately emit current state
    listener(this.isUpdateReady);
    return () => {
      this.listeners.delete(listener);
    };
  }

  public simulateUpdateForTesting() {
    this.setUpdateReady(true);
  }

  public async checkForUpdate(): Promise<boolean> {
    this.lastCheckTime = Date.now();
    if (!('serviceWorker' in navigator)) return false;

    try {
      if (!this.registration) {
        this.registration = await navigator.serviceWorker.getRegistration();
      }

      if (this.registration) {
        await this.registration.update();
        if (this.registration.waiting) {
          this.setUpdateReady(true);
          return true;
        }
      }
    } catch (err) {
      console.warn('[PWA Manager] Error checking for SW update:', err);
    }
    return false;
  }

  public async applyUpdateAndReload(): Promise<void> {
    if (this.updateSWFn) {
      await this.updateSWFn(true);
    } else if (this.registration && this.registration.waiting) {
      this.registration.waiting.postMessage({ type: 'SKIP_WAITING' });
      window.location.reload();
    } else {
      window.location.reload();
    }
  }

  public async clearAllCachesAndReload(): Promise<void> {
    if (typeof window === 'undefined') return;

    try {
      // 1. Unregister all service workers
      if ('serviceWorker' in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        for (const reg of registrations) {
          await reg.unregister();
        }
      }

      // 2. Delete all CacheStorage keys
      if ('caches' in window) {
        const cacheKeys = await caches.keys();
        await Promise.all(cacheKeys.map((key) => caches.delete(key)));
      }

      // 3. Clear sessionStorage and preserve user game progress in localStorage
      sessionStorage.clear();

      console.log('[PWA Manager] All caches purged successfully. Reloading...');
    } catch (err) {
      console.warn('[PWA Manager] Error purging caches:', err);
    }

    // Force hard reload from server
    window.location.href = window.location.origin + window.location.pathname + '?reload=' + Date.now();
  }

  public getStatus() {
    return {
      version: APP_VERSION,
      buildDate: BUILD_DATE,
      isUpdateReady: this.isUpdateReady,
      hasServiceWorker: typeof window !== 'undefined' && 'serviceWorker' in navigator,
      lastCheckTime: this.lastCheckTime,
    };
  }
}

export const pwaUpdateManager = new PWAUpdateManager();
