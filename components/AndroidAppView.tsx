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
  Play, 
  Bot, 
  Sliders,
  RefreshCw,
  Trash2,
  AlertCircle,
  HelpCircle,
  Code2,
  Layers,
  ArrowRight
} from 'lucide-react';
import { useAndroidInstall } from '../hooks/useAndroidInstall';
import { 
  getHapticsEnabled, 
  setHapticsEnabled, 
  vibrateHoleInOne, 
  requestWakeLock, 
  releaseWakeLock 
} from '../utils/androidFeatures';
import { pwaUpdateManager, APP_VERSION, BUILD_DATE } from '../utils/pwaUpdateManager';

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

  // Update manager state
  const [isCheckingUpdate, setIsCheckingUpdate] = useState(false);
  const [updateStatusMsg, setUpdateStatusMsg] = useState<string | null>(null);
  const [isUpdateReady, setIsUpdateReady] = useState(false);
  const [copiedFirebase, setCopiedFirebase] = useState(false);
  const [copiedVercel, setCopiedVercel] = useState(false);
  const [activeUpdateTab, setActiveUpdateTab] = useState<'how' | 'cache' | 'headers'>('how');

  useEffect(() => {
    const unsub = pwaUpdateManager.subscribe((ready) => {
      setIsUpdateReady(ready);
    });
    return () => unsub();
  }, []);

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

  const handleCheckUpdate = async () => {
    setIsCheckingUpdate(true);
    setUpdateStatusMsg(null);
    try {
      const hasUpdate = await pwaUpdateManager.checkForUpdate();
      if (hasUpdate) {
        setUpdateStatusMsg('¡Nueva versión detectada en el servidor! Toca "Aplicar y Reiniciar".');
      } else {
        setUpdateStatusMsg('¡El juego ya está en la versión más reciente (v' + APP_VERSION + ')!');
      }
    } catch {
      setUpdateStatusMsg('No se pudo verificar con el servidor (comprueba tu conexión).');
    } finally {
      setIsCheckingUpdate(false);
    }
  };

  const handleApplyUpdate = async () => {
    setIsCheckingUpdate(true);
    await pwaUpdateManager.applyUpdateAndReload();
  };

  const handlePurgeCache = async () => {
    if (window.confirm('¿Deseas vaciar la memoria caché del juego y recargar los archivos más recientes desde el servidor? Tu progreso de hoyos y monedas se mantendrá a salvo.')) {
      await pwaUpdateManager.clearAllCachesAndReload();
    }
  };

  const handleSimulateUpdate = () => {
    pwaUpdateManager.simulateUpdateForTesting();
    setUpdateStatusMsg('¡Aviso emergente de actualización disparado en la parte superior!');
    setTimeout(() => setUpdateStatusMsg(null), 5000);
  };

  const firebaseSnippet = `{
  "hosting": {
    "headers": [
      {
        "source": "/(sw.js|manifest.webmanifest|index.html)",
        "headers": [
          { "key": "Cache-Control", "value": "no-cache, no-store, must-revalidate" }
        ]
      }
    ]
  }
}`;

  const vercelSnippet = `{
  "headers": [
    {
      "source": "/(sw.js|manifest.webmanifest)",
      "headers": [
        { "key": "Cache-Control", "value": "no-cache, no-store, must-revalidate" }
      ]
    }
  ]
}`;

  const handleCopySnippet = (snippet: string, type: 'firebase' | 'vercel') => {
    navigator.clipboard.writeText(snippet);
    if (type === 'firebase') {
      setCopiedFirebase(true);
      setTimeout(() => setCopiedFirebase(false), 2000);
    } else {
      setCopiedVercel(true);
      setTimeout(() => setCopiedVercel(false), 2000);
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
                <Smartphone className="w-3 h-3" /> Android, PWABuilder & Mobile Port
              </div>
              <h2 className="text-2xl font-black tracking-tight leading-tight">
                Play & Update on Android
              </h2>
              <p className="text-xs text-stone-300 font-medium mt-0.5">
                Installed as a full-screen WebAPK with automatic Over-The-Air updates and offline support.
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
              className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-[#a4c639] hover:bg-[#8ea82b] text-stone-950 font-black text-xs shrink-0 shadow-lg active:scale-95 transition-all cursor-pointer"
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

      {/* ========================================================================= */}
      {/* SECTION: CÓMO ACTUALIZAR EL JUEGO EN LA APP DE PWABUILDER (USER QUESTION) */}
      {/* ========================================================================= */}
      <div className="bg-[#efe6d4] p-5 sm:p-6 rounded-3xl border-2 border-[#a4c639]/50 shadow-md space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#3d312a]/10 pb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#1b2a1e] text-[#a4c639] flex items-center justify-center shrink-0 shadow-sm border border-[#a4c639]/30">
              <RefreshCw className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-[#3d312a] flex items-center gap-2">
                <span>¿Cómo actualizar el juego en la App de PWABuilder?</span>
                <span className="bg-emerald-600 text-white text-[9px] px-2 py-0.5 rounded-full font-bold uppercase">
                  Over-The-Air
                </span>
              </h3>
              <p className="text-xs text-[#7a7065] font-semibold">
                Guía técnica y herramientas para que los cambios se reflejen automáticamente en el móvil
              </p>
            </div>
          </div>

          {/* Quick Version Pill */}
          <div className="flex items-center gap-2 shrink-0 self-start sm:self-center bg-[#faf6ee] px-3 py-1.5 rounded-xl border border-[#3d312a]/10 text-xs font-mono font-bold text-[#3d312a]">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>v{APP_VERSION} ({BUILD_DATE})</span>
          </div>
        </div>

        {/* Live Diagnostics & Action Toolbar */}
        <div className="bg-[#faf6ee] p-4 rounded-2xl border border-[#3d312a]/10 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <p className="text-xs font-extrabold text-[#3d312a]">
                Control de Versión & Caché en Vivo (Service Worker)
              </p>
              <p className="text-[11px] text-[#7a7065]">
                {isUpdateReady 
                  ? '✨ ¡Hay una nueva versión esperando! Pulsa "Aplicar y Reiniciar".'
                  : 'El Service Worker está activo en tu dispositivo. Puedes forzar una comprobación directa.'}
              </p>
            </div>

            <div className="flex items-center gap-2">
              {isUpdateReady && (
                <button
                  type="button"
                  onClick={handleApplyUpdate}
                  className="py-2 px-3 bg-[#a4c639] hover:bg-[#8ea82b] text-stone-950 rounded-xl text-xs font-black flex items-center gap-1.5 shadow-sm active:scale-95 transition-all cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Aplicar y Reiniciar</span>
                </button>
              )}

              <button
                type="button"
                disabled={isCheckingUpdate}
                onClick={handleCheckUpdate}
                className="py-2 px-3 bg-[#3d312a] hover:bg-[#524238] text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm active:scale-95 transition-all cursor-pointer disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isCheckingUpdate ? 'animate-spin' : ''}`} />
                <span>{isCheckingUpdate ? 'Comprobando...' : 'Buscar Actualización'}</span>
              </button>

              <button
                type="button"
                onClick={handleSimulateUpdate}
                title="Muestra el banner de nueva versión en pantalla para probar cómo se ve"
                className="py-2 px-3 bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                <span>Probar Aviso</span>
              </button>

              <button
                type="button"
                onClick={handlePurgeCache}
                title="Borra el almacenamiento en caché local del navegador y vuelve a descargar todo"
                className="py-2 px-3 bg-red-100 hover:bg-red-200 text-red-800 border border-red-300 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Limpiar Caché</span>
              </button>
            </div>
          </div>

          {updateStatusMsg && (
            <div className="p-2.5 rounded-xl bg-blue-50 border border-blue-200 text-blue-900 text-xs font-medium flex items-center gap-2 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
              <span>{updateStatusMsg}</span>
            </div>
          )}
        </div>

        {/* Tab Navigation for Detailed Answers */}
        <div className="flex border-b border-[#3d312a]/10 gap-2">
          <button
            type="button"
            onClick={() => setActiveUpdateTab('how')}
            className={`pb-2 px-3 text-xs font-bold border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
              activeUpdateTab === 'how'
                ? 'border-[#3d312a] text-[#3d312a]'
                : 'border-transparent text-[#7a7065] hover:text-[#3d312a]'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>1. ¿Cómo funciona la actualización?</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveUpdateTab('cache')}
            className={`pb-2 px-3 text-xs font-bold border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
              activeUpdateTab === 'cache'
                ? 'border-[#3d312a] text-[#3d312a]'
                : 'border-transparent text-[#7a7065] hover:text-[#3d312a]'
            }`}
          >
            <AlertCircle className="w-3.5 h-3.5" />
            <span>2. ¿Por qué a veces no cambia? (El Caché)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveUpdateTab('headers')}
            className={`pb-2 px-3 text-xs font-bold border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
              activeUpdateTab === 'headers'
                ? 'border-[#3d312a] text-[#3d312a]'
                : 'border-transparent text-[#7a7065] hover:text-[#3d312a]'
            }`}
          >
            <Code2 className="w-3.5 h-3.5" />
            <span>3. Configurar Hosting (Headers HTTP)</span>
          </button>
        </div>

        {/* Tab 1: How updates work with PWABuilder */}
        {activeUpdateTab === 'how' && (
          <div className="space-y-3 text-xs text-[#3d312a] animate-in fade-in duration-150">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="p-3.5 rounded-2xl bg-[#faf6ee] border border-[#3d312a]/10 space-y-1.5">
                <div className="flex items-center gap-2 text-emerald-800 font-black">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Actualizaciones Automáticas (Over-The-Air)</span>
                </div>
                <p className="text-[#7a7065] leading-relaxed">
                  Las apps creadas con PWABuilder usan tecnología <strong>TWA (Trusted Web Activity)</strong>. El APK instalado en Android <strong>NO empaqueta tu JavaScript</strong>, sino que carga tu URL web en vivo en un contenedor nativo ultrarrápido.
                </p>
                <div className="p-2 rounded-xl bg-emerald-50 text-emerald-900 font-semibold text-[11px]">
                  👉 <strong>¡NO necesitas generar ni reinstalar el APK!</strong> Cada vez que despliegas tu web en tu hosting, los jugadores con la app instalada reciben los cambios automáticamente.
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-[#faf6ee] border border-[#3d312a]/10 space-y-1.5">
                <div className="flex items-center gap-2 text-amber-900 font-black">
                  <AlertCircle className="w-4 h-4 text-amber-600" />
                  <span>¿Cuándo SÍ se debe generar un nuevo APK?</span>
                </div>
                <p className="text-[#7a7065] leading-relaxed">
                  Solo necesitas volver a PWABuilder y subir un nuevo APK / AAB a Google Play si modificas:
                </p>
                <ul className="list-disc list-inside space-y-1 text-[#7a7065] text-[11px] font-medium">
                  <li>El ícono de la app en la pantalla de inicio de Android (launcher icon).</li>
                  <li>El nombre de la aplicación en el launcher (short_name nativo).</li>
                  <li>El ID de paquete Android (ej: <code>com.tuempresa.golf</code>).</li>
                  <li>Pantalla splash nativa de inicio o permisos de Android.</li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Why it might seem not to update (Service Worker Cache) */}
        {activeUpdateTab === 'cache' && (
          <div className="space-y-3 text-xs text-[#3d312a] animate-in fade-in duration-150">
            <p className="text-[#7a7065] leading-relaxed">
              Si ya subiste una nueva versión a tu hosting pero al abrir la app en tu teléfono sigue viéndose la anterior, esto se debe a cómo funciona el <strong>Service Worker</strong>:
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <div className="p-3 rounded-xl bg-[#faf6ee] border border-[#3d312a]/10">
                <span className="w-5 h-5 rounded-full bg-[#db5641] text-white text-[11px] font-bold flex items-center justify-center mb-1.5">1</span>
                <p className="font-extrabold text-[#3d312a] mb-1">Caché Offline</p>
                <p className="text-[11px] text-[#7a7065]">
                  Para que el juego funcione sin internet, los archivos HTML, CSS y JS se guardan en la memoria local del teléfono.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-[#faf6ee] border border-[#3d312a]/10">
                <span className="w-5 h-5 rounded-full bg-[#db5641] text-white text-[11px] font-bold flex items-center justify-center mb-1.5">2</span>
                <p className="font-extrabold text-[#3d312a] mb-1">Descarga Silenciosa</p>
                <p className="text-[11px] text-[#7a7065]">
                  Al abrir la app, el navegador consulta tu servidor en segundo plano. Si detecta cambios, descarga los archivos nuevos en segundo plano.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-[#faf6ee] border border-[#3d312a]/10">
                <span className="w-5 h-5 rounded-full bg-[#db5641] text-white text-[11px] font-bold flex items-center justify-center mb-1.5">3</span>
                <p className="font-extrabold text-[#3d312a] mb-1">Activación Inmediata</p>
                <p className="text-[11px] text-[#7a7065]">
                  Hemos añadido un banner automático en pantalla: en cuanto llega la actualización aparece el aviso flotante <strong>"Actualizar Ahora"</strong> para recargar con 1 toque.
                </p>
              </div>
            </div>

            <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-[11px]">
              💡 <strong>Consejo rápido para probar en tu teléfono:</strong> Si acabas de desplegar y quieres ver los cambios al instante, cierra la app en Android deslizándola hacia arriba en la lista de aplicaciones recientes y vuelve a abrirla, o pulsa el botón <strong>"Limpiar Caché"</strong> arriba.
            </div>
          </div>
        )}

        {/* Tab 3: Hosting HTTP Cache Headers */}
        {activeUpdateTab === 'headers' && (
          <div className="space-y-3 text-xs text-[#3d312a] animate-in fade-in duration-150">
            <p className="text-[#7a7065] leading-relaxed">
              <strong>El error más común:</strong> Si tu servidor de hosting (Firebase, Vercel, Netlify, Cloudflare) almacena en caché el archivo <code>sw.js</code> con un tiempo prolongado (ej: 1 semana), el teléfono nunca sabrá que has subido una nueva versión.
            </p>
            <p className="text-[#7a7065] leading-relaxed font-semibold">
              Configura tu servidor para que <code>sw.js</code> y <code>manifest.webmanifest</code> tengan <code>Cache-Control: no-cache</code>:
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {/* Firebase Hosting */}
              <div className="p-3 rounded-xl bg-[#1b2a1e] text-white border border-[#a4c639]/30">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-bold text-[#a4c639] text-[11px]">firebase.json</span>
                  <button
                    type="button"
                    onClick={() => handleCopySnippet(firebaseSnippet, 'firebase')}
                    className="p-1 text-stone-300 hover:text-white flex items-center gap-1 text-[10px] cursor-pointer"
                  >
                    {copiedFirebase ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedFirebase ? '¡Copiado!' : 'Copiar'}</span>
                  </button>
                </div>
                <pre className="text-[10px] font-mono text-emerald-300 overflow-x-auto p-2 bg-black/40 rounded-lg">
                  {firebaseSnippet}
                </pre>
              </div>

              {/* Vercel */}
              <div className="p-3 rounded-xl bg-[#1b2a1e] text-white border border-[#a4c639]/30">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-bold text-[#a4c639] text-[11px]">vercel.json</span>
                  <button
                    type="button"
                    onClick={() => handleCopySnippet(vercelSnippet, 'vercel')}
                    className="p-1 text-stone-300 hover:text-white flex items-center gap-1 text-[10px] cursor-pointer"
                  >
                    {copiedVercel ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedVercel ? '¡Copiado!' : 'Copiar'}</span>
                  </button>
                </div>
                <pre className="text-[10px] font-mono text-emerald-300 overflow-x-auto p-2 bg-black/40 rounded-lg">
                  {vercelSnippet}
                </pre>
              </div>
            </div>
          </div>
        )}
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
                className="flex-1 py-2 px-3 bg-[#db5641] hover:bg-[#c24a37] text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm active:scale-95 transition-all cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Prompt Install Now</span>
              </button>
            )}
            <button
              type="button"
              onClick={handleCopyUrl}
              className="py-2 px-3 bg-[#faf6ee] hover:bg-white text-[#3d312a] border border-[#3d312a]/15 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
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
                  Visit <code>pwabuilder.com</code>, enter your game's URL, and click "Package for Android" to download a signed APK or Google Play package.
                </p>
              </div>

              <div className="p-2.5 rounded-xl bg-[#faf6ee] border border-[#3d312a]/10">
                <p className="font-bold text-[#3d312a]">Option B: Google Bubblewrap CLI</p>
                <p className="text-[11px] text-[#7a7065] mt-0.5 font-mono truncate">
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
                className={`w-11 h-6 rounded-full transition-colors relative p-0.5 cursor-pointer ${
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
                className={`w-11 h-6 rounded-full transition-colors relative p-0.5 cursor-pointer ${
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
            <p className="text-base">🔄</p>
            <p className="text-[11px] font-bold text-[#3d312a]">OTA Updates</p>
            <p className="text-[9px] text-[#7a7065]">Auto-sync without APK reinstall</p>
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
            className="w-full py-3.5 bg-[#db5641] hover:bg-[#c24a37] text-white rounded-2xl font-black text-sm flex items-center justify-center gap-2 shadow-lg active:scale-95 transition-all cursor-pointer"
          >
            <Play className="w-4 h-4 fill-white" />
            <span>Tee Off Now</span>
          </button>
        </div>
      )}
    </div>
  );
};
