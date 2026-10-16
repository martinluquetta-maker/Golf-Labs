import { useState, useEffect } from 'react';

export interface AndroidInstallState {
  isInstallable: boolean;
  isInstalled: boolean;
  isAndroid: boolean;
  promptInstall: () => Promise<boolean>;
}

export function useAndroidInstall(): AndroidInstallState {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isAndroid, setIsAndroid] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Detect Android device
    const ua = navigator.userAgent || '';
    const isAndroidDevice = /Android/i.test(ua);
    setIsAndroid(isAndroidDevice);

    // Check if already in standalone display mode (installed)
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || 
      (window.navigator as any).standalone === true ||
      document.referrer.includes('android-app://');
    setIsInstalled(isStandalone);

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const promptInstall = async (): Promise<boolean> => {
    if (!deferredPrompt) {
      return false;
    }
    try {
      deferredPrompt.prompt();
      const choiceResult = await deferredPrompt.userChoice;
      if (choiceResult.outcome === 'accepted') {
        setIsInstalled(true);
        setDeferredPrompt(null);
        return true;
      }
      return false;
    } catch (e) {
      console.warn('Install prompt error:', e);
      return false;
    }
  };

  return {
    isInstallable: Boolean(deferredPrompt),
    isInstalled,
    isAndroid,
    promptInstall
  };
}
