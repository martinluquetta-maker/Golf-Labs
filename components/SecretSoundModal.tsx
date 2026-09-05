import React from 'react';
import { Sparkles, X, Volume2, ArrowLeft } from 'lucide-react';
import { Language, t } from '../utils/translations';

interface SecretSoundModalProps {
  isOpen: boolean;
  onClose: () => void;
  language?: Language;
}

export const SecretSoundModal: React.FC<SecretSoundModalProps> = ({
  isOpen,
  onClose,
  language = 'es',
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="bg-[#1e1713] border-2 border-[#ffb347]/40 text-stone-200 rounded-3xl w-full max-w-md p-6 sm:p-7 shadow-2xl relative overflow-hidden flex flex-col items-center text-center space-y-5 animate-in zoom-in-95 duration-200">
        {/* Background ambient glow */}
        <div className="absolute -top-16 -right-16 w-36 h-36 bg-amber-500/15 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -bottom-16 -left-16 w-36 h-36 bg-[#db5641]/15 rounded-full blur-2xl pointer-events-none" />

        {/* Close button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 text-stone-400 hover:text-white bg-[#2c221b] hover:bg-[#3d3027] p-2 rounded-full transition-colors cursor-pointer"
          title="Cerrar"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Secret Badge Header */}
        <div className="flex flex-col items-center space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 text-[11px] font-black uppercase tracking-widest">
            <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-spin" style={{ animationDuration: '6s' }} />
            <span>Página Secreta • Easter Egg</span>
          </div>

          <h3 className="text-2xl sm:text-3xl font-black text-white flex items-center gap-2">
            <Volume2 className="w-7 h-7 text-[#ffb347] animate-pulse" />
            ¿Va a Jugar o Qué?
          </h3>

          <p className="text-xs text-stone-300 max-w-xs leading-relaxed font-medium">
            ¡Has encontrado el rincón secreto de los ajustes! Presiona el botón oficial para cuando tu rival tarda una eternidad en apuntar en el green.
          </p>
        </div>

        {/* Embedded Instant Sound Button Box */}
        <div className="bg-[#2a1f18] border-2 border-dashed border-[#ffb347]/30 p-4 sm:p-5 rounded-3xl w-full flex flex-col items-center justify-center shadow-inner relative group">
          <div className="flex items-center justify-center min-h-[200px] w-full">
            <iframe
              width="110"
              height="200"
              src="https://www.myinstants.com/instant/va-a-jugar-o-que-20033/embed/"
              frameBorder="0"
              scrolling="no"
              className="rounded-2xl shadow-xl transition-transform hover:scale-105"
              title="Va a jugar o que"
            />
          </div>

          <span className="text-[10px] text-amber-400/90 font-mono font-bold mt-2 uppercase tracking-wider flex items-center gap-1">
            🔊 MyInstants Soundboard Button
          </span>
        </div>

        {/* Return Button */}
        <button
          type="button"
          onClick={onClose}
          className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black py-3.5 px-6 rounded-2xl font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg transition-all active:scale-98 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Volver al Menú de Ajustes</span>
        </button>
      </div>
    </div>
  );
};
