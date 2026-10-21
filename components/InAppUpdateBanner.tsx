/**
 * In-App Update Banner for PWA & Android PWABuilder App
 * Displays an elegant non-blocking notification when a new version of the game has been deployed,
 * allowing instant 1-tap reload without having to reinstall the APK.
 */

import React, { useEffect, useState } from 'react';
import { RefreshCw, Sparkles, X, CheckCircle2 } from 'lucide-react';
import { pwaUpdateManager, APP_VERSION } from '../utils/pwaUpdateManager';

interface InAppUpdateBannerProps {
  language?: string;
}

export const InAppUpdateBanner: React.FC<InAppUpdateBannerProps> = ({ language = 'es' }) => {
  const [hasUpdate, setHasUpdate] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const unsubscribe = pwaUpdateManager.subscribe((updateReady) => {
      setHasUpdate(updateReady);
      if (updateReady) {
        setDismissed(false);
      }
    });

    return () => unsubscribe();
  }, []);

  if (!hasUpdate || dismissed) {
    return null;
  }

  const isEs = language === 'es';

  const handleUpdate = async () => {
    setIsUpdating(true);
    try {
      await pwaUpdateManager.applyUpdateAndReload();
    } catch {
      window.location.reload();
    }
  };

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[200] w-[92%] max-w-md pointer-events-auto animate-in slide-in-from-top-4 duration-300">
      <div className="bg-[#1b2a1e] text-[#faf6ee] p-3.5 sm:p-4 rounded-2xl shadow-2xl border-2 border-[#a4c639]/60 flex items-center justify-between gap-3 backdrop-blur-md">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-[#a4c639]/20 text-[#a4c639] flex items-center justify-center shrink-0 border border-[#a4c639]/40 relative">
            <Sparkles className="w-5 h-5 animate-pulse text-[#a4c639]" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] uppercase font-black tracking-wider bg-[#a4c639] text-[#1b2a1e] px-1.5 py-0.2 rounded-sm">
                OTA Update
              </span>
              <span className="text-[10px] text-emerald-300 font-mono">
                v{APP_VERSION}
              </span>
            </div>
            <p className="text-xs font-bold text-white truncate mt-0.5">
              {isEs ? '¡Nueva versión disponible!' : 'New game version ready!'}
            </p>
            <p className="text-[10px] text-stone-300 leading-tight truncate">
              {isEs
                ? 'Nuevas físicas, correcciones y mejoras.'
                : 'Fresh courses, physics tweaks & features.'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            disabled={isUpdating}
            onClick={handleUpdate}
            className="py-1.5 px-3 bg-[#a4c639] hover:bg-[#8eb02d] text-[#1b2a1e] text-xs font-extrabold rounded-xl shadow-md flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer disabled:opacity-60"
          >
            {isUpdating ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>{isEs ? 'Cargando...' : 'Updating...'}</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>{isEs ? 'Actualizar' : 'Update'}</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={() => setDismissed(true)}
            className="p-1.5 text-stone-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
            title={isEs ? 'Posponer' : 'Dismiss'}
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
