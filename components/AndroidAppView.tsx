import React, { useState, useEffect } from 'react';
import { 
  Smartphone, 
  Download, 
  CheckCircle2, 
  ExternalLink, 
  Copy, 
  Check, 
  Vibrate, 
  Sun, 
  Sparkles, 
  ShieldCheck, 
  WifiOff, 
  Play, 
  Bot, 
  Info,
  Sliders
} from 'lucide-react';
import { useAndroidInstall } from '../hooks/useAndroidInstall';
import { 
  getHapticsEnabled, 
  setHapticsEnabled, 
  vibrateHoleInOne, 
  vibratePutt,
  requestWakeLock,
  releaseWakeLock
} from '../utils/androidFeatures';

interface AndroidAppViewProps {
  onStartGame?: () => void;
}

export const AndroidAppView: React.FC<AndroidAppViewProps> = ({ onStartGame }) => {
  const { isInstallable, isInstalled, isAndroid, promptInstall } = useAndroidInstall();
  const [haptics, setHaptics] = useState(getHapticsEnabled());
  const [wakeLockActive, setWakeLockActive] = useState(true);
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);
  const [installSuccess, setInstallSuccess] = useState(false);

  const appUrl = typeof window !== 'undefined' ? window.location.href : 'https://ais-pre-2pcahhf54g6f5d7dbjxkrn-627003930031.us-east1.run.app';

  const handleToggleHaptics = (enabled: boolean) => {
    setHaptics(enabled);
    setHapticsEnabled(enabled);
    if (enabled) {
      vibrateHoleInOne();
    }
  };

  const handleToggleWakeLock = async (enabled: boolean) => {
    setWakeLockActive(enabled);
    if (enabled) {
      await requestWakeLock();
    } else {
      await releaseWakeLock();
    }
  };

  const handleCopyUrl = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(appUrl);
      setCopiedUrl(true);
      setTimeout(() => setCopiedUrl(false), 2000);
    }
  };

  const handleInstallClick = async () => {
    setIsInstalling(true);
    const accepted = await promptInstall();
    setIsInstalling(false);
    if (accepted) {
      setInstallSuccess(true);
    }
  };

  return (
    <div className="flex-1 flex flex-col p-6 overflow-y-auto space-y-6">
      {/* Header Banner */}
      <div className="relative bg-gradient-to-br from-[#1b2a1e] via-[#243c29] to-[#162519] p-6 rounded-3xl border border-[#a4c639]/30 text-white shadow-xl overflow-hidden">
        <div className="absolute top-0 right-0 -mt-4 -mr-4 w-40 h-40 bg-[#a4c639]/10 rounded-full blur-2xl pointer-events-none" />
        <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-[#a4c639]/20 border border-[#a4c639]/40 flex items-center justify-center shrink-0 shadow-inner">
              <Bot className="w-8 h-8 text-[#a4c639]" />
            </div>
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#a4c639]/20 text-[#a4c639] text-[10px] font-black uppercase tracking-wider mb-1">
                <Smartphone className="w-3 h-3" /> Android & Mobile Native Port
              </div>
              <h2 className="text-2xl font-black tracking-tight leading-tight">
                Play on Android
              </h2>
              <p className="text-xs text-stone-300 font-medium mt-0.5">
                Installed as a full-screen WebAPK with haptics, offline support, and touch assist.
              </p>
            </div>
          </div>

          {/* Quick Install Action or Installed Badge */}
          {isInstalled || installSuccess ? (
            <div className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-[#a4c639]/20 border border-[#a4c639]/40 text-[#a4c639] font-black text-xs shrink-0 shadow-sm">
              <CheckCircle2 className="w-4 h-4" />
              <span>Installed as Android App</span>
            </div>
          ) : isInstallable ? (
            <button
              type="button"
              onClick={handleInstallClick}
              disabled={isInstalling}
              className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-[#a4c639] hover:bg-[#8ea82b] text-stone-950 font-black text-xs shrink-0 shadow-lg active:scale-95 transition-all"
            >
              <Download className="w-4 h-4" />
              <span>{isInstalling ? 'Installing...' : 'Install on Android'}</span>
            </button>
          ) : (
            <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-2xl bg-white/10 text-stone-300 text-[11px] font-bold">
              <span>PWA Ready</span>
            </div>
          )}
        </div>
      </div>

      {/* Main Grid: Status & Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Card 1: 1-Tap Installation & Instructions */}
        <div className="bg-[#efe6d4] p-5 rounded-2xl border border-[#3d312a]/10 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-xl bg-[#db5641]/15 text-[#db5641] flex items-center justify-center font-bold">
                <Download className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-extrabold text-sm text-[#3d312a]">
                  Direct Chrome Installation
                </h3>
                <p className="text-[11px] text-[#7a7065] font-semibold">
                  Zero download from app stores needed
                </p>
              </div>
            </div>

            <p className="text-xs text-[#3d312a]/80 mb-3 leading-relaxed">
              When opened in <strong>Google Chrome</strong> or <strong>Samsung Internet</strong> on any Android phone or tablet, you can install the game directly to your home screen:
            </p>

            <ol className="space-y-2 text-xs text-[#3d312a]/90 font-medium pl-1">
              <li className="flex items-start gap-2">
                <span className="w-4 h-4 rounded-full bg-[#db5641] text-white text-[10px] flex items-center justify-center font-bold shrink-0 mt-0.5">1</span>
                <span>Tap the <strong>Chrome menu (three dots ⋮)</strong> in the top-right.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-4 h-4 rounded-full bg-[#db5641] text-white text-[10px] flex items-center justify-center font-bold shrink-0 mt-0.5">2</span>
                <span>Select <strong>"Install app"</strong> or <strong>"Add to Home screen"</strong>.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-4 h-4 rounded-full bg-[#db5641] text-white text-[10px] flex items-center justify-center font-bold shrink-0 mt-0.5">3</span>
                <span>The game installs as a standalone Android WebAPK with an icon in your app drawer!</span>
              </li>
            </ol>
          </div>

          <div className="mt-4 pt-3 border-t border-[#3d312a]/10 flex gap-2">
            {isInstallable && (
              <button
                type="button"
                onClick={handleInstallClick}
                className="flex-1 py-2 px-3 bg-[#db5641] hover:bg-[#c24a37] text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm active:scale-95 transition-all"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Prompt Install Now</span>
              </button>
            )}
            <button
              type="button"
              onClick={handleCopyUrl}
              className="py-2 px-3 bg-[#faf6ee] hover:bg-white text-[#3d312a] border border-[#3d312a]/15 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all"
            >
              {copiedUrl ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedUrl ? 'URL Copied!' : 'Copy Game Link'}</span>
            </button>
          </div>
        </div>

        {/* Card 2: Convert to Standalone APK / Google Play */}
        <div className="bg-[#efe6d4] p-5 rounded-2xl border border-[#3d312a]/10 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-xl bg-emerald-600/15 text-emerald-700 flex items-center justify-center font-bold">
                <ExternalLink className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-extrabold text-sm text-[#3d312a]">
                  Package into APK or Google Play (.aab)
                </h3>
                <p className="text-[11px] text-[#7a7065] font-semibold">
                  Google Play & Sideload APK builder
                </p>
              </div>
            </div>

            <p className="text-xs text-[#3d312a]/80 mb-3 leading-relaxed">
              Because this app includes a compliant <strong>Web App Manifest</strong> and <strong>Service Worker</strong>, you can turn it into an Android package file in seconds:
            </p>

            <div className="space-y-2 text-xs">
              <div className="p-2.5 rounded-xl bg-[#faf6ee] border border-[#3d312a]/10">
                <p className="font-bold text-[#3d312a]">Option A: PWABuilder (1-Click APK)</p>
                <p className="text-[11px] text-[#7a7065] mt-0.5">
                  Visit <code>pwabuilder.com</code>, enter your game's URL, and click "Package for Android" to download a signed APK.
                </p>
              </div>

              <div className="p-2.5 rounded-xl bg-[#faf6ee] border border-[#3d312a]/10">
                <p className="font-bold text-[#3d312a]">Option B: Google Bubblewrap CLI</p>
                <p className="text-[11px] text-[#7a7065] mt-0.5 font-mono">
                  npm i -g @bubblewrap/cli && bubblewrap init --manifest={appUrl}manifest.webmanifest
                </p>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-[#3d312a]/10">
            <a
              href="https://www.pwabuilder.com"
              target="_blank"
              rel="noreferrer"
              className="w-full py-2 px-3 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm transition-all"
            >
              <span>Open PWABuilder Generator</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      </div>

      {/* Hardware & Mobile Settings */}
      <div className="bg-[#efe6d4] p-5 rounded-2xl border border-[#3d312a]/10 space-y-4">
        <div className="flex items-center gap-2">
          <Sliders className="w-4 h-4 text-[#db5641]" />
          <h3 className="font-extrabold text-sm text-[#3d312a]">
            Android Hardware & Mobile Features
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Haptics Toggle */}
          <div className="bg-[#faf6ee] p-3.5 rounded-xl border border-[#3d312a]/10 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-amber-500/15 text-amber-600 flex items-center justify-center">
                <Vibrate className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-[#3d312a]">Haptic Vibration</p>
                <p className="text-[10px] text-[#7a7065]">Tactile feedback on putts & hits</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleToggleHaptics(!haptics)}
                className={`w-11 h-6 rounded-full transition-colors relative p-0.5 ${
                  haptics ? 'bg-emerald-600' : 'bg-stone-300'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${
                    haptics ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Screen WakeLock Toggle */}
          <div className="bg-[#faf6ee] p-3.5 rounded-xl border border-[#3d312a]/10 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-blue-500/15 text-blue-600 flex items-center justify-center">
                <Sun className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-[#3d312a]">Keep Screen Awake</p>
                <p className="text-[10px] text-[#7a7065]">Prevents display sleep during play</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleToggleWakeLock(!wakeLockActive)}
                className={`w-11 h-6 rounded-full transition-colors relative p-0.5 ${
                  wakeLockActive ? 'bg-emerald-600' : 'bg-stone-300'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${
                    wakeLockActive ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>
        </div>

        {/* Feature Badges */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2">
          <div className="p-2 rounded-xl bg-[#faf6ee] border border-[#3d312a]/5 text-center">
            <p className="text-base">🎯</p>
            <p className="text-[11px] font-bold text-[#3d312a]">Mobile Aimbot</p>
            <p className="text-[9px] text-[#7a7065]">Hole lock & 1-tap sink</p>
          </div>
          <div className="p-2 rounded-xl bg-[#faf6ee] border border-[#3d312a]/5 text-center">
            <p className="text-base">🎮</p>
            <p className="text-[11px] font-bold text-[#3d312a]">Touch Assist Dials</p>
            <p className="text-[9px] text-[#7a7065]">Precision mobile aiming</p>
          </div>
          <div className="p-2 rounded-xl bg-[#faf6ee] border border-[#3d312a]/5 text-center">
            <p className="text-base">📴</p>
            <p className="text-[11px] font-bold text-[#3d312a]">Offline Ready</p>
            <p className="text-[9px] text-[#7a7065]">Play without Wi-Fi</p>
          </div>
          <div className="p-2 rounded-xl bg-[#faf6ee] border border-[#3d312a]/5 text-center">
            <p className="text-base">⚡</p>
            <p className="text-[11px] font-bold text-[#3d312a]">Haptic Feedback</p>
            <p className="text-[9px] text-[#7a7065]">Putt & bounce vibration</p>
          </div>
        </div>
      </div>

      {/* Start Playing CTA */}
      {onStartGame && (
        <div className="pt-2">
          <button
            type="button"
            onClick={onStartGame}
            className="w-full py-3.5 bg-[#db5641] hover:bg-[#c24a37] text-white rounded-2xl font-black text-sm flex items-center justify-center gap-2 shadow-lg active:scale-95 transition-all"
          >
            <Play className="w-4 h-4 fill-white" />
            <span>Tee Off Now</span>
          </button>
        </div>
      )}
    </div>
  );
};
