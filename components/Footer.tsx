/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React from 'react';
import ScorePill from "./builds/ScorePill";
import { IconGolf, IconReset } from "./Icons";
import { GameState } from '../types';
import { Flame } from 'lucide-react';
import { Language, t } from '../utils/translations';

interface FooterProps {
  gameState: GameState;
  par: number;
  numLevels: number;
  mulligan: () => void;
  language?: Language;
}

const Footer: React.FC<FooterProps> = ({ gameState, par, numLevels, mulligan, language = 'es' }) => {
  return (
    <ScorePill>
      <div className="flex items-center gap-[4.5px] justify-center">
        <IconGolf size={20} />
        <span className="text-[16px] md:text-[18px]">{t('menu_hole', language)} {gameState.currentLevelIndex + 1}/{numLevels}</span>
      </div>
      <div className="flex items-center gap-[4.5px] justify-center">
        <span className="text-[16px] md:text-[18px]">{t('menu_par', language)} {par}</span>
      </div>
      <div className="flex items-center gap-[4.5px] justify-center">
        <span className="text-[16px] md:text-[18px]">{gameState.strokes} {t('strokes', language)}</span>
      </div>
      {gameState.holeInOneStreak !== undefined && gameState.holeInOneStreak > 0 && (
        <div className="flex items-center gap-[4.5px] justify-center text-[#db5641] font-extrabold flex-shrink-0">
          <Flame className="w-[18px] h-[18px] text-[#db5641] fill-[#db5641] animate-pulse" />
          <span className="text-[16px] md:text-[18px]">{gameState.holeInOneStreak} Streak</span>
        </div>
      )}
      <button className={'rounded-full bg-[#3d312a]/10 hover:bg-[#3d312a]/20 active:bg-[#3d312a]/30 p-1 transition-colors text-[#3d312a] flex items-center justify-center'} onClick={() => mulligan()} aria-label='mulligan' title='mulligan'>
        <IconReset size={24} width={24} height={24} />
      </button>
    </ScorePill>
  );
};

export default Footer;
